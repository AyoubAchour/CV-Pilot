import type { CvDocument, CvExperience } from "../../../../shared/cv-model";
import {
  cloneCv,
  emptyExperience,
  escapeHtml,
  fromLines,
  toLines,
} from "../helpers";
import type { SetCv } from "../cv_update";

export function renderExperienceList(options: {
  root: HTMLElement;
  getCv: () => CvDocument;
  setCv: SetCv;
  openEntries: Set<number>;
}) {
  const { root, getCv, setCv, openEntries } = options;

  const list = root.querySelector<HTMLDivElement>("[data-role=experience-list]");
  if (!list) {
    return;
  }

  const currentCv = getCv();
  const items = currentCv.experience ?? [];

  if (items.length > 0 && openEntries.size === 0) {
    openEntries.add(0);
  }

  if (items.length === 0) {
    list.innerHTML = `
      <div class="text-center py-8 bg-slate-50 border border-dashed border-slate-300">
        <div class="flex h-12 w-12 items-center justify-center bg-slate-100 text-slate-500 mx-auto mb-3">
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <p class="text-sm text-slate-600 font-medium">No experience entries yet</p>
        <p class="text-xs text-slate-500 mt-1">Click "Add" to add your work experience</p>
      </div>
    `;
    return;
  }

  list.innerHTML = items
    .map(
      (item, index) => {
        const isOpen = openEntries.has(index);
        const hasContent = item.role || item.company;
        const displayTitle = hasContent 
          ? `${item.role}${item.company ? ` at ${item.company}` : ''}`
          : `Experience ${index + 1}`;
        const displaySubtitle = item.start || item.end 
          ? `${item.start || 'Start'} - ${item.end || 'Present'}`
          : '';

        return `
          <div
            class="group bg-white border border-slate-200 overflow-hidden transition-all duration-200 ${isOpen ? 'ring-1 ring-blue-500/20 shadow-sm' : 'hover:border-slate-300'}"
            data-role="exp-entry"
            data-index="${index}"
          >
            <!-- Card Header -->
            <div 
              class="flex items-center gap-3 px-4 py-3 cursor-pointer select-none ${isOpen ? 'bg-blue-50/50' : 'bg-slate-50/50 hover:bg-slate-100/50'} transition-colors"
              data-action="toggle-exp"
              data-index="${index}"
            >
              <!-- Drag Handle -->
              <div class="text-slate-300 cursor-grab active:cursor-grabbing">
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
                </svg>
              </div>

              <!-- Title Section -->
              <div class="flex-1 min-w-0">
                <h4 class="text-sm font-semibold text-slate-900 truncate">
                  ${escapeHtml(displayTitle)}
                </h4>
                ${displaySubtitle ? `<p class="text-xs text-slate-500 mt-0.5">${escapeHtml(displaySubtitle)}</p>` : ''}
              </div>

              <!-- Actions -->
              <div class="flex items-center gap-1">
                <button
                  type="button"
                  class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all"
                  data-action="remove-exp"
                  data-index="${index}"
                  title="Remove entry"
                >
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
                <div class="text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}">
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <!-- Card Body -->
            <div class="${isOpen ? 'block' : 'hidden'}">
              <div class="p-4 border-t border-slate-100">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1.5">Role</label>
                    <input 
                      type="text"
                      class="w-full px-3 py-2 bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                      data-exp-field="role" 
                      data-index="${index}"
                      placeholder="Software Engineer"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1.5">Company</label>
                    <input 
                      type="text"
                      class="w-full px-3 py-2 bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                      data-exp-field="company" 
                      data-index="${index}"
                      placeholder="Acme Inc."
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1.5">Location</label>
                    <input 
                      type="text"
                      class="w-full px-3 py-2 bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                      data-exp-field="location" 
                      data-index="${index}"
                      placeholder="San Francisco, CA"
                    />
                  </div>
                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <label class="block text-sm font-medium text-slate-700 mb-1.5">Start</label>
                      <input 
                        type="text"
                        class="w-full px-3 py-2 bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                        data-exp-field="start" 
                        data-index="${index}"
                        placeholder="2024"
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-slate-700 mb-1.5">End</label>
                      <input 
                        type="text"
                        class="w-full px-3 py-2 bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                        data-exp-field="end" 
                        data-index="${index}"
                        placeholder="Present"
                      />
                    </div>
                  </div>
                  <div class="sm:col-span-2">
                    <label class="block text-sm font-medium text-slate-700 mb-1.5">
                      Highlights <span class="text-slate-400 font-normal">(one per line)</span>
                    </label>
                    <textarea 
                      rows="4"
                      class="w-full px-3 py-2 bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow resize-none"
                      data-exp-field="highlights" 
                      data-index="${index}"
                      placeholder="Led a team of 5 developers&#10;Improved performance by 40%&#10;Shipped 3 major features"
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;
      }
    )
    .join("");

  // Add click handlers for toggling
  const toggleButtons = list.querySelectorAll<HTMLElement>('[data-action="toggle-exp"]');
  toggleButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      // Don't toggle if clicking the remove button
      if ((e.target as HTMLElement).closest('[data-action="remove-exp"]')) {
        return;
      }
      
      const indexAttr = button.getAttribute('data-index');
      const index = indexAttr ? Number(indexAttr) : NaN;
      if (!Number.isFinite(index)) return;

      if (openEntries.has(index)) {
        openEntries.delete(index);
      } else {
        openEntries.add(index);
      }
      renderExperienceList(options);
    });
  });

  const bind = (
    selector: string,
    groupKey: string,
    getValue: (item: CvExperience) => string,
    setValue: (item: CvExperience, value: string) => void
  ) => {
    const inputs = list.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(selector);
    for (const input of inputs) {
      const indexAttr = input.getAttribute("data-index");
      const index = indexAttr ? Number(indexAttr) : NaN;
      const cv = getCv();
      if (!Number.isFinite(index) || !cv.experience?.[index]) {
        continue;
      }

      input.value = getValue(cv.experience[index]);

      input.addEventListener("input", () => {
        const next = cloneCv(getCv());
        const item = next.experience[index];
        setValue(item, input.value);
        setCv(next, { kind: "typing", groupKey: `experience[${index}].${groupKey}` });
      });
    }
  };

  bind('[data-exp-field="role"]', "role", (i) => i.role, (i, v) => {
    i.role = v;
  });
  bind('[data-exp-field="company"]', "company", (i) => i.company, (i, v) => {
    i.company = v;
  });
  bind('[data-exp-field="location"]', "location", (i) => i.location, (i, v) => {
    i.location = v;
  });
  bind('[data-exp-field="start"]', "start", (i) => i.start, (i, v) => {
    i.start = v;
  });
  bind('[data-exp-field="end"]', "end", (i) => i.end, (i, v) => {
    i.end = v;
  });
  bind(
    '[data-exp-field="highlights"]',
    "highlights",
    (i) => fromLines(i.highlights ?? []),
    (i, v) => {
      i.highlights = toLines(v);
    }
  );

  const removeButtons = list.querySelectorAll<HTMLButtonElement>("[data-action=remove-exp]");
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
      next.experience.splice(index, 1);
      if (next.experience.length === 0) {
        next.experience.push(emptyExperience());
      }

      // Shift open state indices after removal.
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
      if (openEntries.size === 0 && next.experience.length > 0) {
        openEntries.add(0);
      }

      setCv(next, { kind: "structural", groupKey: "experience" });
      renderExperienceList(options);
    });
  }

  const entryDetails = list.querySelectorAll<HTMLDetailsElement>("[data-role=exp-entry]");
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

export function bindAddExperience(options: {
  root: HTMLElement;
  getCv: () => CvDocument;
  setCv: SetCv;
  openEntries: Set<number>;
  render: () => void;
}) {
  const { root, getCv, setCv, openEntries, render } = options;

  root
    .querySelector<HTMLButtonElement>("[data-action=add-experience]")
    ?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      root
        .querySelector<HTMLDetailsElement>("[data-role=section-experience]")
        ?.setAttribute("open", "");

      const next = cloneCv(getCv());
      next.experience.push(emptyExperience());
      openEntries.add(next.experience.length - 1);
      setCv(next, { kind: "structural", groupKey: "experience" });
      render();
    });
}
