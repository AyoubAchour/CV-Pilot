import { Trash2, createIcons } from "lucide";

import type { CvDocument } from "../../../../shared/cv-model";
import { cloneCv, emptyVolunteering, fromLines, toLines } from "../helpers";
import type { SetCv } from "../cv_update";

export function renderVolunteeringList(options: {
  root: HTMLElement;
  getCv: () => CvDocument;
  setCv: SetCv;
}) {
  const { root, getCv, setCv } = options;

  const list = root.querySelector<HTMLDivElement>("[data-role=volunteering-list]");
  if (!list) {
    return;
  }

  const currentCv = getCv();
  const items = currentCv.volunteering ?? [];

  if (items.length === 0) {
    list.innerHTML = `
      <div class="text-center py-6 bg-slate-50 border border-dashed border-slate-300">
        <p class="text-sm text-slate-500">No volunteering entries yet</p>
      </div>
    `;
    return;
  }

  list.innerHTML = items
    .map(
      (_item, index) => `
          <div class="border border-slate-200 bg-slate-50 p-3" data-role="volunteer" data-index="${index}">
            <div class="flex items-center justify-between">
              <h4 class="text-xs font-semibold text-slate-900">Entry ${index + 1}</h4>
              <button
                type="button"
                class="inline-flex items-center gap-1 border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-900 hover:bg-slate-50"
                data-action="remove-volunteering"
                data-index="${index}"
              >
                <i data-lucide="trash-2" class="h-3.5 w-3.5"></i>
                Remove
              </button>
            </div>

            <div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label class="block">
                <span class="text-xs font-medium text-slate-700">Role</span>
                <input class="mt-1 w-full border border-slate-200 px-3 py-2 text-sm" data-vol-field="role" data-index="${index}" />
              </label>
              <label class="block">
                <span class="text-xs font-medium text-slate-700">Organization</span>
                <input class="mt-1 w-full border border-slate-200 px-3 py-2 text-sm" data-vol-field="organization" data-index="${index}" />
              </label>
              <label class="block">
                <span class="text-xs font-medium text-slate-700">Location</span>
                <input class="mt-1 w-full border border-slate-200 px-3 py-2 text-sm" data-vol-field="location" data-index="${index}" />
              </label>
              <label class="block">
                <span class="text-xs font-medium text-slate-700">Start</span>
                <input class="mt-1 w-full border border-slate-200 px-3 py-2 text-sm" data-vol-field="start" data-index="${index}" placeholder="2024" />
              </label>
              <label class="block">
                <span class="text-xs font-medium text-slate-700">End</span>
                <input class="mt-1 w-full border border-slate-200 px-3 py-2 text-sm" data-vol-field="end" data-index="${index}" placeholder="Present" />
              </label>
              <label class="block sm:col-span-2">
                <span class="text-xs font-medium text-slate-700">Highlights (one per line)</span>
                <textarea class="mt-1 min-h-21 w-full border border-slate-200 px-3 py-2 text-sm" data-vol-field="highlights" data-index="${index}"></textarea>
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
    getValue: (item: CvDocument["volunteering"][number]) => string,
    setValue: (item: CvDocument["volunteering"][number], value: string) => void
  ) => {
    const inputs = list.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(selector);
    for (const input of inputs) {
      const indexAttr = input.getAttribute("data-index");
      const index = indexAttr ? Number(indexAttr) : NaN;
      const cv = getCv();
      if (!Number.isFinite(index) || !cv.volunteering?.[index]) {
        continue;
      }

      input.value = getValue(cv.volunteering[index]);

      input.addEventListener("input", () => {
        const next = cloneCv(getCv());
        const item = next.volunteering[index];
        setValue(item, input.value);
        setCv(next, { kind: "typing", groupKey: `volunteering[${index}].${groupKey}` });
      });
    }
  };

  bind('[data-vol-field="role"]', "role", (i) => i.role, (i, v) => {
    i.role = v;
  });
  bind('[data-vol-field="organization"]', "organization", (i) => i.organization, (i, v) => {
    i.organization = v;
  });
  bind('[data-vol-field="location"]', "location", (i) => i.location, (i, v) => {
    i.location = v;
  });
  bind('[data-vol-field="start"]', "start", (i) => i.start, (i, v) => {
    i.start = v;
  });
  bind('[data-vol-field="end"]', "end", (i) => i.end, (i, v) => {
    i.end = v;
  });
  bind(
    '[data-vol-field="highlights"]',
    "highlights",
    (i) => fromLines(i.highlights ?? []),
    (i, v) => {
      i.highlights = toLines(v);
    }
  );

  const removeButtons = list.querySelectorAll<HTMLButtonElement>("[data-action=remove-volunteering]");
  for (const button of removeButtons) {
    button.addEventListener("click", () => {
      const indexAttr = button.getAttribute("data-index");
      const index = indexAttr ? Number(indexAttr) : NaN;
      if (!Number.isFinite(index)) {
        return;
      }

      const next = cloneCv(getCv());
      next.volunteering.splice(index, 1);
      setCv(next, { kind: "structural", groupKey: "volunteering" });
      renderVolunteeringList(options);
    });
  }
}

export function bindAddVolunteering(options: {
  root: HTMLElement;
  getCv: () => CvDocument;
  setCv: SetCv;
  render: () => void;
}) {
  const { root, getCv, setCv, render } = options;

  root
    .querySelector<HTMLButtonElement>("[data-action=add-volunteering]")
    ?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const next = cloneCv(getCv());
      next.sections.volunteering = true;
      next.volunteering.push(emptyVolunteering());
      setCv(next, { kind: "structural", groupKey: "volunteering" });
      render();

      const details = root.querySelector<HTMLDetailsElement>(
        "[data-role=section-volunteering]"
      );
      if (details) {
        details.open = true;
      }

      root
        .querySelector<HTMLElement>("[data-role=section-body-volunteering]")
        ?.classList.remove("hidden");

      const index = next.volunteering.length - 1;
      root
        .querySelector<HTMLInputElement>(
          `[data-vol-field="role"][data-index="${index}"]`
        )
        ?.focus();
    });
}
