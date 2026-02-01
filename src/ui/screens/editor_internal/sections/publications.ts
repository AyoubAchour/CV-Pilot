import { Trash2, createIcons } from "lucide";

import type { CvDocument } from "../../../../shared/cv-model";
import { cloneCv, emptyPublication, fromLines, toLines } from "../helpers";
import type { SetCv } from "../cv_update";

export function renderPublicationsList(options: {
  root: HTMLElement;
  getCv: () => CvDocument;
  setCv: SetCv;
}) {
  const { root, getCv, setCv } = options;

  const list = root.querySelector<HTMLDivElement>("[data-role=publications-list]");
  if (!list) {
    return;
  }

  const currentCv = getCv();
  const items = currentCv.publications ?? [];

  list.innerHTML = items
    .map(
      (_item, index) => `
          <div class="border border-slate-200 bg-slate-50 p-3" data-role="publication" data-index="${index}">
            <div class="flex items-center justify-between">
              <h4 class="text-xs font-semibold text-slate-900">Entry ${index + 1}</h4>
              <button
                type="button"
                class="inline-flex items-center gap-1 border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-900 hover:bg-slate-50"
                data-action="remove-publication"
                data-index="${index}"
              >
                <i data-lucide="trash-2" class="h-3.5 w-3.5"></i>
                Remove
              </button>
            </div>

            <div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label class="block">
                <span class="text-xs font-medium text-slate-700">Title</span>
                <input class="mt-1 w-full border border-slate-200 px-3 py-2 text-sm" data-publication-field="title" data-index="${index}" />
              </label>
              <label class="block">
                <span class="text-xs font-medium text-slate-700">Venue</span>
                <input class="mt-1 w-full border border-slate-200 px-3 py-2 text-sm" data-publication-field="venue" data-index="${index}" />
              </label>
              <label class="block">
                <span class="text-xs font-medium text-slate-700">Date</span>
                <input class="mt-1 w-full border border-slate-200 px-3 py-2 text-sm" data-publication-field="date" data-index="${index}" placeholder="2025" />
              </label>
              <label class="block">
                <span class="text-xs font-medium text-slate-700">Link</span>
                <input class="mt-1 w-full border border-slate-200 px-3 py-2 text-sm" data-publication-field="link" data-index="${index}" placeholder="https://..." />
              </label>
              <label class="block sm:col-span-2">
                <span class="text-xs font-medium text-slate-700">Details (one per line)</span>
                <textarea class="mt-1 min-h-21 w-full border border-slate-200 px-3 py-2 text-sm" data-publication-field="highlights" data-index="${index}"></textarea>
              </label>
            </div>
          </div>
        `
    )
    .join("");

  createIcons({
    icons: { Trash2 },
    nameAttr: "data-lucide",
    root: list,
  });

  const bind = (
    selector: string,
    groupKey: string,
    getValue: (item: CvDocument["publications"][number]) => string,
    setValue: (item: CvDocument["publications"][number], value: string) => void
  ) => {
    const inputs = list.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(selector);
    for (const input of inputs) {
      const indexAttr = input.getAttribute("data-index");
      const index = indexAttr ? Number(indexAttr) : NaN;
      const cv = getCv();
      if (!Number.isFinite(index) || !cv.publications?.[index]) {
        continue;
      }

      input.value = getValue(cv.publications[index]);

      input.addEventListener("input", () => {
        const next = cloneCv(getCv());
        const item = next.publications[index];
        setValue(item, input.value);
        setCv(next, { kind: "typing", groupKey: `publications[${index}].${groupKey}` });
      });
    }
  };

  bind('[data-publication-field="title"]', "title", (i) => i.title, (i, v) => {
    i.title = v;
  });
  bind('[data-publication-field="venue"]', "venue", (i) => i.venue, (i, v) => {
    i.venue = v;
  });
  bind('[data-publication-field="date"]', "date", (i) => i.date, (i, v) => {
    i.date = v;
  });
  bind('[data-publication-field="link"]', "link", (i) => i.link, (i, v) => {
    i.link = v;
  });
  bind(
    '[data-publication-field="highlights"]',
    "highlights",
    (i) => fromLines(i.highlights ?? []),
    (i, v) => {
      i.highlights = toLines(v);
    }
  );

  const removeButtons = list.querySelectorAll<HTMLButtonElement>("[data-action=remove-publication]");
  for (const button of removeButtons) {
    button.addEventListener("click", () => {
      const indexAttr = button.getAttribute("data-index");
      const index = indexAttr ? Number(indexAttr) : NaN;
      if (!Number.isFinite(index)) {
        return;
      }

      const next = cloneCv(getCv());
      next.publications.splice(index, 1);
      setCv(next, { kind: "structural", groupKey: "publications" });
      renderPublicationsList(options);
    });
  }
}

export function bindAddPublication(options: {
  root: HTMLElement;
  getCv: () => CvDocument;
  setCv: SetCv;
  render: () => void;
}) {
  const { root, getCv, setCv, render } = options;

  root
    .querySelector<HTMLButtonElement>("[data-action=add-publication]")
    ?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const next = cloneCv(getCv());
      next.publications.push(emptyPublication());
      setCv(next, { kind: "structural", groupKey: "publications" });
      render();
    });
}
