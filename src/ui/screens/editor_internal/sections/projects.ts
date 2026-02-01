import type { CvDocument } from "../../../../shared/cv-model";
import { cloneCv, emptyProject, fromLines, toLines } from "../helpers";
import type { SetCv } from "../cv_update";

export function renderProjectsList(options: {
  root: HTMLElement;
  getCv: () => CvDocument;
  setCv: SetCv;
}) {
  const { root, getCv, setCv } = options;

  const list = root.querySelector<HTMLDivElement>("[data-role=projects-list]");
  if (!list) {
    return;
  }

  const currentCv = getCv();
  const items = currentCv.projects ?? [];

  if (items.length === 0) {
    list.innerHTML = `
      <div class="text-center py-6 bg-slate-50 border border-dashed border-slate-300">
        <p class="text-sm text-slate-500">No projects added yet</p>
      </div>
    `;
    return;
  }

  list.innerHTML = items
    .map(
      (item, index) => `
          <div class="group bg-white border border-slate-200 p-4 hover:border-slate-300 transition-colors" data-role="project" data-index="${index}">
            <div class="flex items-start justify-between gap-3">
              <div class="flex-1 min-w-0">
                <h4 class="text-sm font-semibold text-slate-900">${item.title || `Project ${index + 1}`}</h4>
                ${item.date ? `<p class="text-xs text-slate-500 mt-0.5">${item.date}</p>` : ''}
              </div>
              <button
                type="button"
                class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all"
                data-action="remove-project"
                data-index="${index}"
                title="Remove project"
              >
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>

            <div class="mt-4 grid grid-cols-1 gap-4">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1.5">Title</label>
                  <input 
                    type="text"
                    class="w-full px-3 py-2 bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                    data-project-field="title" 
                    data-index="${index}"
                    placeholder="Project name"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1.5">Date</label>
                  <input 
                    type="text"
                    class="w-full px-3 py-2 bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                    data-project-field="date" 
                    data-index="${index}"
                    placeholder="2025"
                  />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">Link</label>
                <input 
                  type="url"
                  class="w-full px-3 py-2 bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                  data-project-field="link" 
                  data-index="${index}"
                  placeholder="https://github.com/username/project"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">
                  Highlights <span class="text-slate-400 font-normal">(one per line)</span>
                </label>
                <textarea 
                  rows="3"
                  class="w-full px-3 py-2 bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow resize-none"
                  data-project-field="highlights" 
                  data-index="${index}"
                  placeholder="Built with React and Node.js&#10;Implemented user authentication&#10;Deployed to AWS"
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
    getValue: (item: CvDocument["projects"][number]) => string,
    setValue: (item: CvDocument["projects"][number], value: string) => void
  ) => {
    const inputs = list.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(selector);
    for (const input of inputs) {
      const indexAttr = input.getAttribute("data-index");
      const index = indexAttr ? Number(indexAttr) : NaN;
      const cv = getCv();
      if (!Number.isFinite(index) || !cv.projects?.[index]) {
        continue;
      }

      input.value = getValue(cv.projects[index]);

      input.addEventListener("input", () => {
        const next = cloneCv(getCv());
        const item = next.projects[index];
        setValue(item, input.value);
        setCv(next, { kind: "typing", groupKey: `projects[${index}].${groupKey}` });
      });
    }
  };

  bind('[data-project-field="title"]', "title", (i) => i.title, (i, v) => {
    i.title = v;
  });
  bind('[data-project-field="date"]', "date", (i) => i.date, (i, v) => {
    i.date = v;
  });
  bind('[data-project-field="link"]', "link", (i) => i.link, (i, v) => {
    i.link = v;
  });
  bind(
    '[data-project-field="highlights"]',
    "highlights",
    (i) => fromLines(i.highlights ?? []),
    (i, v) => {
      i.highlights = toLines(v);
    }
  );

  const removeButtons = list.querySelectorAll<HTMLButtonElement>("[data-action=remove-project]");
  for (const button of removeButtons) {
    button.addEventListener("click", () => {
      const indexAttr = button.getAttribute("data-index");
      const index = indexAttr ? Number(indexAttr) : NaN;
      if (!Number.isFinite(index)) {
        return;
      }

      const next = cloneCv(getCv());
      next.projects.splice(index, 1);
      setCv(next, { kind: "structural", groupKey: "projects" });
      renderProjectsList(options);
    });
  }
}

export function bindAddProject(options: {
  root: HTMLElement;
  getCv: () => CvDocument;
  setCv: SetCv;
  render: () => void;
}) {
  const { root, getCv, setCv, render } = options;

  root
    .querySelector<HTMLButtonElement>("[data-action=add-project]")
    ?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const next = cloneCv(getCv());
      next.projects.push(emptyProject());
      setCv(next, { kind: "structural", groupKey: "projects" });
      render();
    });
}
