import type { CvDocument } from "../../../shared/cv-model";
import { getCvTitle, renderCvHtmlDocument } from "../../../shared/cv-template";

export interface PreviewController {
  update: (cv: CvDocument) => void;
}

export function createPreviewController(root: HTMLElement): PreviewController {
  let scrollTopRatio = 0;
  let scrollLeftRatio = 0;

  const previewViewport = root.querySelector<HTMLDivElement>(
    "[data-role=preview-viewport]"
  );

  previewViewport?.addEventListener("scroll", () => {
    const maxTop = Math.max(0, previewViewport.scrollHeight - previewViewport.clientHeight);
    const maxLeft = Math.max(0, previewViewport.scrollWidth - previewViewport.clientWidth);
    scrollTopRatio = maxTop > 0 ? previewViewport.scrollTop / maxTop : 0;
    scrollLeftRatio = maxLeft > 0 ? previewViewport.scrollLeft / maxLeft : 0;
  });

  const update = (cv: CvDocument) => {
    const titleEl = root.querySelector<HTMLHeadingElement>("[data-role=cv-title]");
    if (titleEl) {
      titleEl.textContent = getCvTitle(cv);
    }

    const iframe = root.querySelector<HTMLIFrameElement>("[data-role=cv-preview]");
    if (!iframe) {
      return;
    }

    // Prevent nested scrolling inside the iframe (outer viewport handles scroll).
    iframe.setAttribute("scrolling", "no");

    iframe.onload = () => {
      const indicator = root.querySelector<HTMLParagraphElement>(
        "[data-role=preview-pages]"
      );
      if (!indicator) {
        return;
      }

      try {
        const doc = iframe.contentDocument;
        if (!doc) {
          indicator.textContent = "";
          return;
        }

        // Ensure the iframe content itself never shows scrollbars.
        doc.documentElement.style.overflow = "hidden";
        doc.body.style.overflow = "hidden";

        const previewFrameWrap = root.querySelector<HTMLDivElement>(
          "[data-role=preview-frame-wrap]"
        );

        const probe = doc.createElement("div");
        probe.style.height = "297mm";
        probe.style.width = "210mm";
        probe.style.position = "absolute";
        probe.style.visibility = "hidden";
        doc.body.appendChild(probe);

        const pageHeightPx = probe.getBoundingClientRect().height;
        const pageWidthPx = probe.getBoundingClientRect().width;
        doc.body.removeChild(probe);

        if (
          !pageHeightPx ||
          !Number.isFinite(pageHeightPx) ||
          !pageWidthPx ||
          !Number.isFinite(pageWidthPx)
        ) {
          indicator.textContent = "";
          return;
        }

        // Size the iframe to the rendered document height at A4 width.
        iframe.style.width = `${pageWidthPx}px`;
        iframe.style.height = "1px";
        const docHeight = doc.documentElement.scrollHeight;
        iframe.style.height = `${docHeight}px`;

        const pages = Math.max(1, Math.ceil(docHeight / pageHeightPx));

        if (pages === 1) {
          indicator.textContent = "Fits on 1 page.";
          indicator.className = "mt-1 text-xs font-medium text-emerald-700";
        } else {
          indicator.textContent = `Spills to ${pages} pages. Consider trimming for a 1-page resume.`;
          indicator.className = "mt-1 text-xs font-medium text-amber-700";
        }

        // Scale to fit the A4 viewport.
        if (previewViewport && previewFrameWrap) {
          const viewportWidth = previewViewport.clientWidth;
          // Subtract a tiny epsilon and round down to avoid 1px overflow causing horizontal scrollbars.
          const rawScale = Math.max(0.1, Math.min(1, (viewportWidth - 2) / pageWidthPx));
          const scale = Math.max(0.1, Math.floor(rawScale * 1000) / 1000);

          previewFrameWrap.style.width = `${Math.floor(pageWidthPx * scale)}px`;
          previewFrameWrap.style.height = `${Math.floor(docHeight * scale)}px`;

          iframe.style.transformOrigin = "top left";
          iframe.style.transform = `scale(${scale})`;

          // Restore scroll position (ratio-based) after rerender.
          const maxTop = Math.max(0, previewViewport.scrollHeight - previewViewport.clientHeight);
          const maxLeft = Math.max(0, previewViewport.scrollWidth - previewViewport.clientWidth);
          previewViewport.scrollTop = maxTop * scrollTopRatio;
          previewViewport.scrollLeft = maxLeft * scrollLeftRatio;
        }
      } catch {
        // If cross-origin or rendering quirks, just hide the indicator.
      }
    };

    iframe.srcdoc = renderCvHtmlDocument(cv);
  };

  return { update };
}
