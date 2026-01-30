import { Trash2, createIcons } from "lucide";

import type { CvDocument } from "../../../../shared/cv-model";
import { cloneCv, emptyAward, fromLines, toLines } from "../helpers";

export function renderAwardsList(options: {
  root: HTMLElement;
  getCv: () => CvDocument;
  setCv: (next: CvDocument) => void;
}) {
  const { root, getCv, setCv } = options;

  const list = root.querySelector<HTMLDivElement>("[data-role=awards-list]");
  if (!list) {
    return;
  }

  const currentCv = getCv();
  const items = currentCv.awards ?? [];

  list.innerHTML = items
    .map(
      (_item, index) => `
          <div class="rounded border border-slate-200 bg-slate-50 p-3" data-role="award" data-index="${index}">
            <div class="flex items-center justify-between">
              <h4 class="text-xs font-semibold text-slate-900">Entry ${index + 1}</h4>
              <button
                type="button"
                class="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-900 hover:bg-slate-50"
                data-action="remove-award"
                data-index="${index}"
              >
                <i data-lucide="trash-2" class="h-3.5 w-3.5"></i>
                Remove
              </button>
            </div>

            <div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label class="block">
                <span class="text-xs font-medium text-slate-700">Title</span>
                <input class="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm" data-award-field="title" data-index="${index}" />
              </label>
              <label class="block">
                <span class="text-xs font-medium text-slate-700">Issuer</span>
                <input class="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm" data-award-field="issuer" data-index="${index}" />
              </label>
              <label class="block">
                <span class="text-xs font-medium text-slate-700">Date</span>
                <input class="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm" data-award-field="date" data-index="${index}" placeholder="2025" />
              </label>
              <label class="block sm:col-span-2">
                <span class="text-xs font-medium text-slate-700">Details (one per line)</span>
                <textarea class="mt-1 min-h-21 w-full rounded border border-slate-200 px-3 py-2 text-sm" data-award-field="highlights" data-index="${index}"></textarea>
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
    getValue: (item: CvDocument["awards"][number]) => string,
    setValue: (item: CvDocument["awards"][number], value: string) => void
  ) => {
    const inputs = list.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(selector);
    for (const input of inputs) {
      const indexAttr = input.getAttribute("data-index");
      const index = indexAttr ? Number(indexAttr) : NaN;
      const cv = getCv();
      if (!Number.isFinite(index) || !cv.awards?.[index]) {
        continue;
      }

      input.value = getValue(cv.awards[index]);

      input.addEventListener("input", () => {
        const next = cloneCv(getCv());
        const item = next.awards[index];
        setValue(item, input.value);
        setCv(next);
      });
    }
  };

  bind('[data-award-field="title"]', (i) => i.title, (i, v) => {
    i.title = v;
  });
  bind('[data-award-field="issuer"]', (i) => i.issuer, (i, v) => {
    i.issuer = v;
  });
  bind('[data-award-field="date"]', (i) => i.date, (i, v) => {
    i.date = v;
  });
  bind('[data-award-field="highlights"]', (i) => fromLines(i.highlights ?? []), (i, v) => {
    i.highlights = toLines(v);
  });

  const removeButtons = list.querySelectorAll<HTMLButtonElement>("[data-action=remove-award]");
  for (const button of removeButtons) {
    button.addEventListener("click", () => {
      const indexAttr = button.getAttribute("data-index");
      const index = indexAttr ? Number(indexAttr) : NaN;
      if (!Number.isFinite(index)) {
        return;
      }

      const next = cloneCv(getCv());
      next.awards.splice(index, 1);
      setCv(next);
      renderAwardsList(options);
    });
  }
}

export function bindAddAward(options: {
  root: HTMLElement;
  getCv: () => CvDocument;
  setCv: (next: CvDocument) => void;
  render: () => void;
}) {
  const { root, getCv, setCv, render } = options;

  root
    .querySelector<HTMLButtonElement>("[data-action=add-award]")
    ?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const next = cloneCv(getCv());
      next.awards.push(emptyAward());
      setCv(next);
      render();
    });
}
