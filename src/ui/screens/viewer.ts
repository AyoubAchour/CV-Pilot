import {
  ArrowLeft,
  FilePlus,
  Search,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  createIcons,
} from "lucide";

import * as pdfjsLib from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.mjs?url";
import {
  EventBus,
  PDFFindController,
  PDFLinkService,
  PDFViewer,
} from "pdfjs-dist/web/pdf_viewer.mjs";

import "pdfjs-dist/web/pdf_viewer.css";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

export interface ViewerScreenModel {
  project: ProjectSummary;
  pdfBytes: Uint8Array;
}

export interface ViewerScreenHandlers {
  onBack?: () => void;
  onEditAsCv?: () => void;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderViewerScreen(
  root: HTMLElement,
  model: ViewerScreenModel,
  handlers: ViewerScreenHandlers = {}
) {
  root.innerHTML = `
    <div class="flex min-h-screen">
      <aside class="w-56 shrink-0 bg-slate-800">
        <div class="flex h-full flex-col">
          <div class="flex items-center gap-2 px-4 py-4">
            <div class="flex h-8 w-8 items-center justify-center bg-blue-600 text-xs font-bold text-white">
              CV
            </div>
            <span class="text-sm font-semibold text-white">CV Pilot</span>
          </div>

          <nav class="mt-2 flex-1 px-2">
            <a
              href="#"
              class="flex items-center gap-2 rounded px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white"
              data-action="back"
            >
              <i data-lucide="arrow-left" class="h-4 w-4"></i>
              Back
            </a>
          </nav>
        </div>
      </aside>

      <main class="flex-1 bg-slate-100">
        <div class="border-b border-slate-200 bg-white px-6 py-4">
          <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between gap-4">
              <div>
                <h1 class="text-lg font-semibold text-slate-900">${escapeHtml(
                  model.project.title
                )}</h1>
                <p class="text-xs text-slate-500">Project: ${escapeHtml(
                  model.project.id
                )}</p>
              </div>

              <button
                type="button"
                class="inline-flex items-center gap-2 border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-sm hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                data-action="back"
              >
                <i data-lucide="arrow-left" class="h-4 w-4"></i>
                Back
              </button>
            </div>

            <div class="flex flex-wrap items-center gap-2">
              <div class="inline-flex items-center gap-2 border border-slate-200 bg-white px-3 py-2">
                <i data-lucide="search" class="h-4 w-4 text-slate-500"></i>
                <input
                  class="w-56 bg-transparent text-sm text-slate-900 outline-none"
                  placeholder="Find in document…"
                  type="text"
                  data-action="find-input"
                />
                <span class="text-xs text-slate-500" data-role="find-count"></span>
              </div>

              <button
                type="button"
                class="inline-flex items-center gap-1 border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-900 shadow-sm hover:bg-slate-50"
                data-action="find-prev"
                title="Previous match"
              >
                <i data-lucide="chevron-left" class="h-4 w-4"></i>
              </button>
              <button
                type="button"
                class="inline-flex items-center gap-1 border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-900 shadow-sm hover:bg-slate-50"
                data-action="find-next"
                title="Next match"
              >
                <i data-lucide="chevron-right" class="h-4 w-4"></i>
              </button>

              <div class="mx-2 h-6 w-px bg-slate-200"></div>

              <button
                type="button"
                class="inline-flex items-center gap-2 border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-sm hover:bg-slate-50"
                data-action="edit-cv"
                title="Convert extracted text into an editable CV"
              >
                <i data-lucide="file-plus" class="h-4 w-4"></i>
                Edit as CV
              </button>

              <button
                type="button"
                class="inline-flex items-center gap-1 border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-900 shadow-sm hover:bg-slate-50"
                data-action="zoom-out"
                title="Zoom out"
              >
                <i data-lucide="zoom-out" class="h-4 w-4"></i>
              </button>
              <button
                type="button"
                class="inline-flex items-center gap-1 border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-900 shadow-sm hover:bg-slate-50"
                data-action="zoom-in"
                title="Zoom in"
              >
                <i data-lucide="zoom-in" class="h-4 w-4"></i>
              </button>

              <div class="mx-2 h-6 w-px bg-slate-200"></div>

              <div class="inline-flex items-center gap-2 border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700">
                <span>Page</span>
                <input
                  class="w-14 rounded border border-slate-200 px-2 py-1 text-xs"
                  type="number"
                  min="1"
                  data-action="page-input"
                />
                <span class="text-slate-400">/</span>
                <span data-role="page-total">—</span>
              </div>
            </div>
          </div>
        </div>

        <div class="p-6">
          <div class="relative h-[calc(100vh-140px)] border border-slate-200 bg-slate-200">
            <div id="viewerContainer" class="absolute inset-0 overflow-auto">
              <div id="viewer" class="pdfViewer"></div>
            </div>
          </div>
        </div>
      </main>
    </div>
  `;

  createIcons({
    icons: {
      ArrowLeft,
      FilePlus,
      Search,
      ChevronLeft,
      ChevronRight,
      ZoomIn,
      ZoomOut,
    },
    nameAttr: "data-lucide",
    root,
  });

  const backButtons = root.querySelectorAll<HTMLButtonElement | HTMLAnchorElement>(
    '[data-action="back"]'
  );
  for (const button of backButtons) {
    button.addEventListener("click", (e) => {
      e.preventDefault();
      handlers.onBack?.();
    });
  }

  const editCvButton = root.querySelector<HTMLButtonElement>('[data-action="edit-cv"]');
  editCvButton?.addEventListener("click", () => {
    handlers.onEditAsCv?.();
  });

  const viewerContainer = root.querySelector<HTMLDivElement>("#viewerContainer");
  const viewerEl = root.querySelector<HTMLDivElement>("#viewer");
  const pageInput = root.querySelector<HTMLInputElement>(
    '[data-action="page-input"]'
  );
  const pageTotal = root.querySelector<HTMLSpanElement>("[data-role=page-total]");
  const findInput = root.querySelector<HTMLInputElement>(
    '[data-action="find-input"]'
  );
  const findCount = root.querySelector<HTMLSpanElement>("[data-role=find-count]");
  const findPrev = root.querySelector<HTMLButtonElement>(
    '[data-action="find-prev"]'
  );
  const findNext = root.querySelector<HTMLButtonElement>(
    '[data-action="find-next"]'
  );
  const zoomIn = root.querySelector<HTMLButtonElement>(
    '[data-action="zoom-in"]'
  );
  const zoomOut = root.querySelector<HTMLButtonElement>(
    '[data-action="zoom-out"]'
  );

  if (!viewerContainer || !viewerEl || !pageInput || !pageTotal || !findInput || !findCount) {
    return;
  }

  const eventBus = new EventBus();
  const linkService = new PDFLinkService({ eventBus });
  const findController = new PDFFindController({ eventBus, linkService });
  const pdfViewer = new PDFViewer({
    container: viewerContainer,
    viewer: viewerEl,
    eventBus,
    linkService,
    findController,
    removePageBorders: false,
  });

  linkService.setViewer(pdfViewer);

  let activeQuery = "";

  const dispatchFind = (options: { type?: string; findPrevious?: boolean }) => {
    const query = findInput.value.trim();
    activeQuery = query;

    if (!query) {
      findCount.textContent = "";
      eventBus.dispatch("findbarclose", { source: "ui" });
      return;
    }

    eventBus.dispatch("find", {
      source: "ui",
      type: options.type,
      query,
      caseSensitive: false,
      entireWord: false,
      highlightAll: true,
      findPrevious: options.findPrevious ?? false,
      matchDiacritics: false,
      phraseSearch: true,
    });
  };

  findInput.addEventListener("input", () => {
    dispatchFind({});
  });
  findInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      dispatchFind({ type: "again", findPrevious: e.shiftKey });
    }
  });
  findPrev?.addEventListener("click", () => {
    if (!activeQuery) {
      return;
    }
    dispatchFind({ type: "again", findPrevious: true });
  });
  findNext?.addEventListener("click", () => {
    if (!activeQuery) {
      return;
    }
    dispatchFind({ type: "again", findPrevious: false });
  });

  zoomIn?.addEventListener("click", () => {
    pdfViewer.currentScale = Math.min(pdfViewer.currentScale * 1.1, 4);
  });
  zoomOut?.addEventListener("click", () => {
    pdfViewer.currentScale = Math.max(pdfViewer.currentScale / 1.1, 0.25);
  });

  pageInput.addEventListener("change", () => {
    const next = Number(pageInput.value);
    if (!Number.isFinite(next)) {
      return;
    }
    pdfViewer.currentPageNumber = Math.min(Math.max(1, next), pdfViewer.pagesCount);
  });

  eventBus.on("pagesinit", () => {
    pageTotal.textContent = String(pdfViewer.pagesCount);
    pageInput.value = String(pdfViewer.currentPageNumber);

    // A sane default for readability.
    pdfViewer.currentScaleValue = "page-width";
  });

  eventBus.on("pagechanging", (evt: unknown) => {
    const pageNumber =
      evt && typeof evt === "object" && "pageNumber" in evt
        ? (evt as { pageNumber?: unknown }).pageNumber
        : undefined;
    if (typeof pageNumber === "number") {
      pageInput.value = String(pageNumber);
    }
  });

  eventBus.on("updatefindmatchescount", (evt: unknown) => {
    const matchesCount =
      evt && typeof evt === "object" && "matchesCount" in evt
        ? (evt as { matchesCount?: unknown }).matchesCount
        : undefined;
    const current =
      matchesCount && typeof matchesCount === "object" && "current" in matchesCount
        ? (matchesCount as { current?: unknown }).current
        : undefined;
    const total =
      matchesCount && typeof matchesCount === "object" && "total" in matchesCount
        ? (matchesCount as { total?: unknown }).total
        : undefined;
    if (typeof current === "number" && typeof total === "number" && total > 0) {
      findCount.textContent = `${current}/${total}`;
    } else {
      findCount.textContent = "";
    }
  });

  // Load and render the PDF.
  (async () => {
    try {
      const loadingTask = pdfjsLib.getDocument({ data: model.pdfBytes });
      const pdfDocument = await loadingTask.promise;

      // If the screen was replaced while awaiting.
      if (!viewerContainer.isConnected) {
        try {
          await loadingTask.destroy();
        } catch {
          // ignore
        }
        return;
      }

      linkService.setDocument(pdfDocument, null);
      pdfViewer.setDocument(pdfDocument);
      findController.setDocument(pdfDocument);
      pageTotal.textContent = String(pdfDocument.numPages);
      pageInput.value = "1";
    } catch (err) {
      console.error(err);
      if (viewerEl.isConnected) {
        viewerEl.innerHTML = `
          <div class="p-6 text-sm text-slate-700">
            Failed to load PDF preview.
          </div>
        `;
      }
    }
  })();
}
