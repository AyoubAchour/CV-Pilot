import type { CvDocument } from "../../../../shared/cv-model";
import { cloneCv, emptyCertification, escapeHtml, fromLines, toLines } from "../helpers";
import type { SetCv } from "../cv_update";

export function renderCertificationsList(options: {
  root: HTMLElement;
  getCv: () => CvDocument;
  setCv: SetCv;
}) {
  const { root, getCv, setCv } = options;

  const list = root.querySelector<HTMLDivElement>("[data-role=certifications-list]");
  if (!list) {
    return;
  }

  const currentCv = getCv();
  const items = currentCv.certifications ?? [];

  if (items.length === 0) {
    list.innerHTML = `
      <div class="text-center py-6 bg-slate-50 border border-dashed border-slate-300">
        <p class="text-sm text-slate-500">No certifications added yet</p>
      </div>
    `;
    return;
  }

  list.innerHTML = items
    .map(
      (item, index) => `
          <div class="group bg-white border border-slate-200 p-4 hover:border-slate-300 transition-colors" data-role="cert" data-index="${index}">
            <div class="flex items-start justify-between gap-3">
              <div class="flex-1 min-w-0">
                <h4 class="text-sm font-semibold text-slate-900">${escapeHtml(item.name || `Certification ${index + 1}`)}</h4>
                ${item.issuer ? `<p class="text-xs text-slate-500 mt-0.5">${escapeHtml(item.issuer)}${item.date ? ` · ${escapeHtml(item.date)}` : ''}</p>` : ''}
              </div>
              <button
                type="button"
                class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all"
                data-action="remove-cert"
                data-index="${index}"
                title="Remove certification"
              >
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>

            <div class="mt-4 grid grid-cols-1 gap-4">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1.5">Name</label>
                  <input 
                    type="text"
                    class="w-full px-3 py-2 bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                    data-cert-field="name" 
                    data-index="${index}"
                    placeholder="AWS Certified Solutions Architect"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1.5">Issuer</label>
                  <input 
                    type="text"
                    class="w-full px-3 py-2 bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                    data-cert-field="issuer" 
                    data-index="${index}"
                    placeholder="Amazon Web Services"
                  />
                </div>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1.5">Date</label>
                  <input 
                    type="text"
                    class="w-full px-3 py-2 bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                    data-cert-field="date" 
                    data-index="${index}"
                    placeholder="2025"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1.5">Link</label>
                  <input 
                    type="url"
                    class="w-full px-3 py-2 bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                    data-cert-field="link" 
                    data-index="${index}"
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">
                  Details <span class="text-slate-400 font-normal">(one per line)</span>
                </label>
                <textarea 
                  rows="3"
                  class="w-full px-3 py-2 bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow resize-none"
                  data-cert-field="highlights" 
                  data-index="${index}"
                  placeholder="Credential ID: ABC123&#10;Valid until 2027"
                ></textarea>
              </div>
            </div>
          </div>
        `
    )
    .join("");

  const bind = (
    selector: string,
    groupKey: string,
    getValue: (item: CvDocument["certifications"][number]) => string,
    setValue: (item: CvDocument["certifications"][number], value: string) => void
  ) => {
    const inputs = list.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(selector);
    for (const input of inputs) {
      const indexAttr = input.getAttribute("data-index");
      const index = indexAttr ? Number(indexAttr) : NaN;
      const cv = getCv();
      if (!Number.isFinite(index) || !cv.certifications?.[index]) {
        continue;
      }

      input.value = getValue(cv.certifications[index]);

      input.addEventListener("input", () => {
        const next = cloneCv(getCv());
        const item = next.certifications[index];
        setValue(item, input.value);
        setCv(next, { kind: "typing", groupKey: `certifications[${index}].${groupKey}` });
      });
    }
  };

  bind('[data-cert-field="name"]', "name", (i) => i.name, (i, v) => {
    i.name = v;
  });
  bind('[data-cert-field="issuer"]', "issuer", (i) => i.issuer, (i, v) => {
    i.issuer = v;
  });
  bind('[data-cert-field="date"]', "date", (i) => i.date, (i, v) => {
    i.date = v;
  });
  bind('[data-cert-field="link"]', "link", (i) => i.link, (i, v) => {
    i.link = v;
  });
  bind(
    '[data-cert-field="highlights"]',
    "highlights",
    (i) => fromLines(i.highlights ?? []),
    (i, v) => {
      i.highlights = toLines(v);
    }
  );

  const removeButtons = list.querySelectorAll<HTMLButtonElement>("[data-action=remove-cert]");
  for (const button of removeButtons) {
    button.addEventListener("click", () => {
      const indexAttr = button.getAttribute("data-index");
      const index = indexAttr ? Number(indexAttr) : NaN;
      if (!Number.isFinite(index)) {
        return;
      }

      const next = cloneCv(getCv());
      next.certifications.splice(index, 1);
      setCv(next, { kind: "structural", groupKey: "certifications" });
      renderCertificationsList(options);
    });
  }
}

export function bindAddCertification(options: {
  root: HTMLElement;
  getCv: () => CvDocument;
  setCv: SetCv;
  render: () => void;
}) {
  const { root, getCv, setCv, render } = options;

  root
    .querySelector<HTMLButtonElement>("[data-action=add-certification]")
    ?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const next = cloneCv(getCv());
      next.certifications.push(emptyCertification());
      setCv(next, { kind: "structural", groupKey: "certifications" });
      render();
    });
}
