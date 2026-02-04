import type { CvDocument, CvEducation } from "../../../../shared/cv-model";
import {
  cloneCv,
  emptyEducation,
  escapeHtml,
  fromLines,
  toLines,
} from "../helpers";
import type { SetCv } from "../cv_update";

export function renderEducationList(options: {
  root: HTMLElement;
  getCv: () => CvDocument;
  setCv: SetCv;
  openEntries: Set<number>;
}) {
  const { root, getCv, setCv, openEntries } = options;

  const list = root.querySelector<HTMLDivElement>("[data-role=education-list]");
  if (!list) {
    return;
  }

  const currentCv = getCv();
  const items = currentCv.education ?? [];

  if (items.length === 0) {
    list.innerHTML = `
      <div class="text-center py-8 bg-slate-50 border border-dashed border-slate-300">
        <div class="flex h-12 w-12 items-center justify-center bg-slate-100 text-slate-500 mx-auto mb-3">
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M12 14l9-5-9-5-9 5 9 5z" />
            <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
          </svg>
        </div>
        <p class="text-sm text-slate-600 font-medium">No education entries yet</p>
        <p class="text-xs text-slate-500 mt-1">Click "Add" to add your education</p>
      </div>
    `;
    return;
  }

  list.innerHTML = items
    .map(
      (item, index) => {
        const isOpen = openEntries.has(index);
        const hasContent = item.degree || item.school;
        const displayTitle = hasContent 
          ? `${escapeHtml(item.degree)}${item.school ? ` at ${escapeHtml(item.school)}` : ''}`
          : `Education ${index + 1}`;
        const displaySubtitle = item.start || item.end 
          ? `${item.start || 'Start'} - ${item.end || 'Present'}`
          : '';

        return `
          <div
            class="group bg-white border border-slate-200 overflow-hidden transition-all duration-200 ${isOpen ? 'ring-1 ring-blue-500/20 shadow-sm' : 'hover:border-slate-300'}"
            data-role="edu-entry"
            data-index="${index}"
          >
            <!-- Card Header -->
            <div 
              class="flex items-center gap-3 px-4 py-3 cursor-pointer select-none ${isOpen ? 'bg-blue-50/50' : 'bg-slate-50/50 hover:bg-slate-100/50'} transition-colors"
              data-action="toggle-edu"
              data-index="${index}"
            >
              <!-- Drag Handle -->
              <div class="text-slate-300 cursor-grab active:cursor-grabbing" data-role="edu-drag-handle" data-index="${index}" draggable="true">
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
                  data-action="remove-edu"
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
                    <label class="block text-sm font-medium text-slate-700 mb-1.5">Degree</label>
                    <input 
                      type="text"
                      class="w-full px-3 py-2 bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                      data-edu-field="degree" 
                      data-index="${index}"
                      placeholder="Bachelor of Science"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1.5">School</label>
                    <input 
                      type="text"
                      class="w-full px-3 py-2 bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                      data-edu-field="school" 
                      data-index="${index}"
                      placeholder="University of Example"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1.5">Location</label>
                    <input 
                      type="text"
                      class="w-full px-3 py-2 bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                      data-edu-field="location" 
                      data-index="${index}"
                      placeholder="City, Country"
                    />
                  </div>
                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <label class="block text-sm font-medium text-slate-700 mb-1.5">Start</label>
                      <input 
                        type="text"
                        class="w-full px-3 py-2 bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                        data-edu-field="start" 
                        data-index="${index}"
                        placeholder="2020"
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-slate-700 mb-1.5">End</label>
                      <input 
                        type="text"
                        class="w-full px-3 py-2 bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                        data-edu-field="end" 
                        data-index="${index}"
                        placeholder="2024"
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
                      data-edu-field="highlights" 
                      data-index="${index}"
                      placeholder="GPA: 3.8/4.0&#10;Dean's List&#10;Relevant coursework"
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

  let draggingFromIndex: number | null = null;

  const applyReorder = (from: number, to: number) => {
    if (from === to) return;

    const cv = getCv();
    const items = cv.education ?? [];
    if (!items[from] || !items[to]) return;

    const next = cloneCv(cv);
    const list = next.education;
    if (!list) return;

    const [moved] = list.splice(from, 1);
    list.splice(to, 0, moved);

    const nextOpen = new Set<number>();
    for (const openIndex of openEntries) {
      if (openIndex === from) {
        nextOpen.add(to);
        continue;
      }

      if (from < to) {
        if (openIndex > from && openIndex <= to) {
          nextOpen.add(openIndex - 1);
        } else {
          nextOpen.add(openIndex);
        }
      } else {
        if (openIndex >= to && openIndex < from) {
          nextOpen.add(openIndex + 1);
        } else {
          nextOpen.add(openIndex);
        }
      }
    }

    openEntries.clear();
    for (const v of nextOpen) {
      openEntries.add(v);
    }

    setCv(next, { kind: "structural", groupKey: "education" });
    renderEducationList(options);
  };

  const dragHandles = list.querySelectorAll<HTMLElement>("[data-role=edu-drag-handle]");
  for (const handle of dragHandles) {
    handle.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
    });

    handle.addEventListener("dragstart", (e) => {
      e.stopPropagation();
      const indexAttr = handle.getAttribute("data-index");
      const index = indexAttr ? Number(indexAttr) : NaN;
      if (!Number.isFinite(index)) return;
      draggingFromIndex = index;
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", String(index));
      }
    });

    handle.addEventListener("dragend", () => {
      draggingFromIndex = null;
    });
  }

  const entries = list.querySelectorAll<HTMLElement>("[data-role=edu-entry]");
  for (const entry of entries) {
    entry.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = "move";
      }
    });

    entry.addEventListener("drop", (e) => {
      e.preventDefault();
      e.stopPropagation();

      const toAttr = entry.getAttribute("data-index");
      const rawTo = toAttr ? Number(toAttr) : NaN;
      if (!Number.isFinite(rawTo)) return;

      const rawFrom =
        draggingFromIndex ??
        (e.dataTransfer ? Number(e.dataTransfer.getData("text/plain")) : NaN);
      if (!Number.isFinite(rawFrom)) return;

      // Directional insert: moving down inserts after the target; moving up inserts before.
      if (rawFrom === rawTo) return;
      applyReorder(rawFrom, rawTo);
    });
  }

  // Add click handlers for toggling
  const toggleButtons = list.querySelectorAll<HTMLElement>('[data-action="toggle-edu"]');
  toggleButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      // Don't toggle if clicking the remove button
      if ((e.target as HTMLElement).closest('[data-action="remove-edu"]')) {
        return;
      }

      // Don't toggle if interacting with the drag handle.
      if ((e.target as HTMLElement).closest('[data-role="edu-drag-handle"]')) {
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
      renderEducationList(options);
    });
  });

  const bind = (
    selector: string,
    groupKey: string,
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
        setCv(next, { kind: "typing", groupKey: `education[${index}].${groupKey}` });
      });
    }
  };

  bind('[data-edu-field="degree"]', "degree", (i) => i.degree, (i, v) => {
    i.degree = v;
  });
  bind('[data-edu-field="school"]', "school", (i) => i.school, (i, v) => {
    i.school = v;
  });
  bind('[data-edu-field="location"]', "location", (i) => i.location, (i, v) => {
    i.location = v;
  });
  bind('[data-edu-field="start"]', "start", (i) => i.start, (i, v) => {
    i.start = v;
  });
  bind('[data-edu-field="end"]', "end", (i) => i.end, (i, v) => {
    i.end = v;
  });
  bind(
    '[data-edu-field="highlights"]',
    "highlights",
    (i) => fromLines(i.highlights ?? []),
    (i, v) => {
      i.highlights = toLines(v);
    }
  );

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

      setCv(next, { kind: "structural", groupKey: "education" });
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
  setCv: SetCv;
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
      setCv(next, { kind: "structural", groupKey: "education" });
      render();
    });
}
