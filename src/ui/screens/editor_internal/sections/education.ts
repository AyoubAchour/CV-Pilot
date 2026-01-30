import { Trash2, createIcons } from "lucide";

import type { CvDocument, CvEducation } from "../../../../shared/cv-model";
import {
  cloneCv,
  educationEntryLabel,
  emptyEducation,
  escapeHtml,
  fromLines,
  toLines,
} from "../helpers";

export function renderEducationList(options: {
  root: HTMLElement;
  getCv: () => CvDocument;
  setCv: (next: CvDocument) => void;
  openEntries: Set<number>;
}) {
  const { root, getCv, setCv, openEntries } = options;

  const list = root.querySelector<HTMLDivElement>("[data-role=education-list]");
  if (!list) {
    return;
  }

  const currentCv = getCv();
  const items = currentCv.education ?? [];

  if (items.length > 0 && openEntries.size === 0) {
    openEntries.add(0);
  }

  list.innerHTML = items
    .map(
      (item, index) => `
          <details
            class="rounded border border-slate-200 bg-slate-50 p-3"
            data-role="edu-entry"
            data-index="${index}"
            ${openEntries.has(index) ? "open" : ""}
          >
            <summary class="flex cursor-pointer items-start justify-between gap-3 text-left [&::-webkit-details-marker]:hidden">
              <h4 class="min-w-0 text-xs font-semibold text-slate-900">
                ${escapeHtml(educationEntryLabel(item, index))}
              </h4>
              <button
                type="button"
                class="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-900 hover:bg-slate-50"
                data-action="remove-edu"
                data-index="${index}"
              >
                <i data-lucide="trash-2" class="h-3.5 w-3.5"></i>
                Remove
              </button>
            </summary>

            <div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label class="block">
                <span class="text-xs font-medium text-slate-700">Degree</span>
                <input class="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm" data-edu-field="degree" data-index="${index}" />
              </label>
              <label class="block">
                <span class="text-xs font-medium text-slate-700">School</span>
                <input class="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm" data-edu-field="school" data-index="${index}" />
              </label>
              <label class="block">
                <span class="text-xs font-medium text-slate-700">Location</span>
                <input class="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm" data-edu-field="location" data-index="${index}" />
              </label>
              <label class="block">
                <span class="text-xs font-medium text-slate-700">Start</span>
                <input class="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm" data-edu-field="start" data-index="${index}" placeholder="2020" />
              </label>
              <label class="block">
                <span class="text-xs font-medium text-slate-700">End</span>
                <input class="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm" data-edu-field="end" data-index="${index}" placeholder="2024" />
              </label>
              <label class="block sm:col-span-2">
                <span class="text-xs font-medium text-slate-700">Highlights (one per line)</span>
                <textarea class="mt-1 min-h-21 w-full rounded border border-slate-200 px-3 py-2 text-sm" data-edu-field="highlights" data-index="${index}"></textarea>
              </label>
            </div>
          </details>
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
    getValue: (item: CvEducation) => string,
    setValue: (item: CvEducation, value: string) => void
  ) => {
    const inputs = list.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(selector);
    for (const input of inputs) {
      const indexAttr = input.getAttribute("data-index");
      const index = indexAttr ? Number(indexAttr) : NaN;
      const cv = getCv();
      if (!Number.isFinite(index) || !cv.education?.[index]) {
        continue;
      }

      input.value = getValue(cv.education[index]);

      input.addEventListener("input", () => {
        const next = cloneCv(getCv());
        const item = next.education[index];
        setValue(item, input.value);
        setCv(next);
      });
    }
  };

  bind('[data-edu-field="degree"]', (i) => i.degree, (i, v) => {
    i.degree = v;
  });
  bind('[data-edu-field="school"]', (i) => i.school, (i, v) => {
    i.school = v;
  });
  bind('[data-edu-field="location"]', (i) => i.location, (i, v) => {
    i.location = v;
  });
  bind('[data-edu-field="start"]', (i) => i.start, (i, v) => {
    i.start = v;
  });
  bind('[data-edu-field="end"]', (i) => i.end, (i, v) => {
    i.end = v;
  });
  bind('[data-edu-field="highlights"]', (i) => fromLines(i.highlights ?? []), (i, v) => {
    i.highlights = toLines(v);
  });

  const removeButtons = list.querySelectorAll<HTMLButtonElement>("[data-action=remove-edu]");
  for (const button of removeButtons) {
    button.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const indexAttr = button.getAttribute("data-index");
      const index = indexAttr ? Number(indexAttr) : NaN;
      if (!Number.isFinite(index)) {
        return;
      }

      const next = cloneCv(getCv());
      next.education.splice(index, 1);
      if (next.education.length === 0) {
        next.education.push(emptyEducation());
      }

      const nextOpen = new Set<number>();
      for (const openIndex of openEntries) {
        if (openIndex === index) {
          continue;
        }
        nextOpen.add(openIndex > index ? openIndex - 1 : openIndex);
      }
      openEntries.clear();
      for (const v of nextOpen) {
        openEntries.add(v);
      }
      if (openEntries.size === 0 && next.education.length > 0) {
        openEntries.add(0);
      }

      setCv(next);
      renderEducationList(options);
    });
  }

  const entryDetails = list.querySelectorAll<HTMLDetailsElement>("[data-role=edu-entry]");
  for (const details of entryDetails) {
    details.addEventListener("toggle", () => {
      const indexAttr = details.getAttribute("data-index");
      const index = indexAttr ? Number(indexAttr) : NaN;
      if (!Number.isFinite(index)) {
        return;
      }

      if (details.open) {
        openEntries.add(index);
      } else {
        openEntries.delete(index);
      }
    });
  }
}

export function bindAddEducation(options: {
  root: HTMLElement;
  getCv: () => CvDocument;
  setCv: (next: CvDocument) => void;
  openEntries: Set<number>;
  render: () => void;
}) {
  const { root, getCv, setCv, openEntries, render } = options;

  root
    .querySelector<HTMLButtonElement>("[data-action=add-education]")
    ?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      root
        .querySelector<HTMLDetailsElement>("[data-role=section-education]")
        ?.setAttribute("open", "");

      const next = cloneCv(getCv());
      next.education.push(emptyEducation());
      openEntries.add(next.education.length - 1);
      setCv(next);
      render();
    });
}
