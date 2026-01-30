import * as pdfjsLib from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.mjs?url";
import { createWorker } from "tesseract.js";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

export interface ExtractCvTextResult {
  text: string;
  pageCount: number;
  usedOcr: boolean;
}

function normalizeExtractedText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[\t\f\v]+/g, " ")
    .replace(/ +/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function isTextItem(value: unknown): value is { str: string; hasEOL?: boolean } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const record = value as Record<string, unknown>;
  return typeof record.str === "string";
}

async function extractTextWithPdfJs(pdfBytes: Uint8Array): Promise<{ text: string; pageCount: number }> {
  const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
  const pdfDocument = await loadingTask.promise;

  const pageCount = pdfDocument.numPages;
  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
    const page = await pdfDocument.getPage(pageNumber);
    const content = await page.getTextContent();

    const parts: string[] = [];
    for (const item of content.items as unknown[]) {
      if (!isTextItem(item)) {
        continue;
      }
      const value = item.str;
      if (value.length > 0) {
        parts.push(value);
      }
      if (item.hasEOL) {
        parts.push("\n");
      } else {
        parts.push(" ");
      }
    }

    const pageText = parts.join("").replace(/ +\n/g, "\n").trim();
    if (pageText.length > 0) {
      pages.push(pageText);
    }

    // Hint to release page resources.
    page.cleanup();
  }

  return { text: normalizeExtractedText(pages.join("\n\n")), pageCount };
}

async function extractTextWithOcr(pdfBytes: Uint8Array): Promise<{ text: string; pageCount: number }> {
  const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
  const pdfDocument = await loadingTask.promise;
  const pageCount = pdfDocument.numPages;

  const worker = await createWorker("eng", 1, {
    logger: (m) => {
      // Keep logs lightweight; useful during OCR debugging.
      if (m && typeof m.status === "string") {
        console.log("[OCR]", m.status, m.progress);
      }
    },
  });

  try {
    const pages: string[] = [];

    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
      const page = await pdfDocument.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 2 });

      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Could not get 2D canvas context for OCR");
      }

      await page.render({ canvas, canvasContext: ctx, viewport }).promise;

      const result = await worker.recognize(canvas);
      const pageText = normalizeExtractedText(result.data.text);
      if (pageText.length > 0) {
        pages.push(pageText);
      }

      page.cleanup();
    }

    return { text: normalizeExtractedText(pages.join("\n\n")), pageCount };
  } finally {
    await worker.terminate();
  }
}

export async function extractCvTextFromPdf(pdfBytes: Uint8Array): Promise<ExtractCvTextResult> {
  const pdfJsResult = await extractTextWithPdfJs(pdfBytes);

  // Heuristic: If PDF.js extraction yields very little, it might be scanned.
  const shouldOcr = pdfJsResult.text.length < 80;
  if (!shouldOcr) {
    return { ...pdfJsResult, usedOcr: false };
  }

  const ocrResult = await extractTextWithOcr(pdfBytes);
  return {
    text: ocrResult.text.length > 0 ? ocrResult.text : pdfJsResult.text,
    pageCount: ocrResult.pageCount,
    usedOcr: true,
  };
}
