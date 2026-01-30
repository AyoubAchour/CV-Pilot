import {
  ArrowLeft,
  FileDown,
  Plus,
  Trash2,
  createIcons,
} from "lucide";

import type { CvDocument, CvEducation, CvExperience } from "../../shared/cv-model";
import {
  renderCvHtmlDocument,
  getCvSuggestedFileName,
  getCvTitle,
} from "../../shared/cv-template";

export interface EditorScreenModel {
  project: ProjectSummary;
  cv: CvDocument;
  sourceText?: string;
}

export interface EditorScreenHandlers {
  onBack?: () => void;
  onSave?: (cv: CvDocument) => Promise<void>;
  onExportPdf?: (cv: CvDocument, suggestedFileName: string) => Promise<void>;
}

function toLines(value: string): string[] {
  return value
    .split(/\r?\n/g)
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
}

function fromLines(values: string[]): string {
  return (values ?? []).join("\n");
}

function cloneCv(cv: CvDocument): CvDocument {
  // Keep this explicit; we want deterministic shape.
  return {
    schemaVersion: 1,
    basics: {
      fullName: cv.basics.fullName,
      headline: cv.basics.headline,
      email: cv.basics.email,
      phone: cv.basics.phone,
      location: cv.basics.location,
      links: [...(cv.basics.links ?? [])],
      summary: cv.basics.summary,
    },
    experience: (cv.experience ?? []).map((e) => ({
      company: e.company,
      role: e.role,
      location: e.location,
      start: e.start,
      end: e.end,
      highlights: [...(e.highlights ?? [])],
    })),
    education: (cv.education ?? []).map((e) => ({
      school: e.school,
      degree: e.degree,
      location: e.location,
      start: e.start,
      end: e.end,
      highlights: [...(e.highlights ?? [])],
    })),
    skills: [...(cv.skills ?? [])],
  };
}

function emptyExperience(): CvExperience {
  return {
    company: "",
    role: "",
    location: "",
    start: "",
    end: "",
    highlights: [""],
  };
}

function emptyEducation(): CvEducation {
  return {
    school: "",
    degree: "",
    location: "",
    start: "",
    end: "",
    highlights: [""],
  };
}

export function renderEditorScreen(
  root: HTMLElement,
  model: EditorScreenModel,
  handlers: EditorScreenHandlers = {}
) {
  let currentCv = cloneCv(model.cv);
  let saveTimer: number | null = null;
  let isSaving = false;
  let isExporting = false;

  const setStatus = (status: "saved" | "unsaved" | "saving" | "error", message?: string) => {
    const el = root.querySelector<HTMLSpanElement>("[data-role=save-status]");
    if (!el) {
      return;
    }

    if (status === "saved") {
      el.textContent = "Saved";
      el.className = "text-xs font-medium text-emerald-700";
      return;
    }

    if (status === "saving") {
      el.textContent = "Saving…";
      el.className = "text-xs font-medium text-slate-600";
      return;
    }

    if (status === "error") {
      el.textContent = message ? `Save failed: ${message}` : "Save failed";
      el.className = "text-xs font-medium text-rose-700";
      return;
    }

    el.textContent = "Unsaved";
    el.className = "text-xs font-medium text-slate-600";
  };

  const updatePreview = () => {
    const titleEl = root.querySelector<HTMLHeadingElement>("[data-role=cv-title]");
    if (titleEl) {
      titleEl.textContent = getCvTitle(currentCv);
    }

    const iframe = root.querySelector<HTMLIFrameElement>("[data-role=cv-preview]");
    if (!iframe) {
      return;
    }
    iframe.srcdoc = renderCvHtmlDocument(currentCv);
  };

  const scheduleSave = () => {
    setStatus("unsaved");

    if (!handlers.onSave) {
      return;
    }

    if (saveTimer !== null) {
      window.clearTimeout(saveTimer);
    }

    saveTimer = window.setTimeout(async () => {
      if (isSaving) {
        return;
      }
      isSaving = true;
      setStatus("saving");

      try {
        await handlers.onSave?.(cloneCv(currentCv));
        setStatus("saved");
      } catch (err) {
        console.error(err);
        const message = err instanceof Error ? err.message : "Unknown error";
        setStatus("error", message);
      } finally {
        isSaving = false;
      }
    }, 450);
  };

  const setCv = (next: CvDocument) => {
    currentCv = next;
    updatePreview();
    scheduleSave();
  };

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
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 class="text-lg font-semibold text-slate-900" data-role="cv-title">${model.project.title}</h1>
              <p class="mt-0.5 text-xs text-slate-500">Editor · ${model.project.id}</p>
            </div>

            <div class="flex items-center gap-3">
              <span data-role="save-status" class="text-xs font-medium text-slate-600">Saved</span>

              <button
                type="button"
                class="inline-flex items-center gap-2 border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-sm hover:bg-slate-50"
                data-action="export-pdf"
              >
                <i data-lucide="file-down" class="h-4 w-4"></i>
                Export PDF
              </button>

              <button
                type="button"
                class="inline-flex items-center gap-2 border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-sm hover:bg-slate-50"
                data-action="back"
              >
                <i data-lucide="arrow-left" class="h-4 w-4"></i>
                Back
              </button>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-6 p-6 lg:grid-cols-2">
          <section class="border border-slate-200 bg-white shadow-sm">
            <div class="border-b border-slate-200 px-4 py-3">
              <h2 class="text-sm font-semibold text-slate-900">Edit</h2>
              <p class="mt-1 text-xs text-slate-500">Changes auto-save and reflect in the preview.</p>
            </div>

            <div class="space-y-6 p-4">
              ${
                typeof model.sourceText === "string"
                  ? `
                    <div>
                      <div class="flex items-center justify-between gap-3">
                        <h3 class="text-xs font-semibold uppercase tracking-wide text-slate-500">Extracted Text</h3>
                        <button
                          type="button"
                          class="inline-flex items-center gap-2 rounded border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-900 hover:bg-slate-50"
                          data-action="copy-source"
                        >
                          Copy all
                        </button>
                      </div>

                      <div class="mt-2 flex flex-wrap items-center gap-2">
                        <input
                          class="w-64 rounded border border-slate-200 px-3 py-2 text-xs text-slate-900"
                          type="text"
                          placeholder="Find in extracted text…"
                          data-role="source-find"
                        />
                        <button
                          type="button"
                          class="inline-flex items-center gap-2 rounded border border-slate-200 bg-white px-2 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-50"
                          data-action="source-find-next"
                        >
                          Find next
                        </button>
                        <span class="text-xs text-slate-500" data-role="source-find-status"></span>
                      </div>

                      <textarea
                        class="mt-2 h-48 w-full resize-y rounded border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-[11px] leading-4 text-slate-900"
                        data-role="source-text"
                        readonly
                      ></textarea>
                    </div>
                  `.trim()
                  : ``
              }

              <div>
                <h3 class="text-xs font-semibold uppercase tracking-wide text-slate-500">Basics</h3>
                <div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label class="block">
                    <span class="text-xs font-medium text-slate-700">Full name</span>
                    <input class="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm" data-field="fullName" />
                  </label>

                  <label class="block">
                    <span class="text-xs font-medium text-slate-700">Headline</span>
                    <input class="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm" data-field="headline" />
                  </label>

                  <label class="block">
                    <span class="text-xs font-medium text-slate-700">Email</span>
                    <input class="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm" data-field="email" />
                  </label>

                  <label class="block">
                    <span class="text-xs font-medium text-slate-700">Phone</span>
                    <input class="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm" data-field="phone" />
                  </label>

                  <label class="block">
                    <span class="text-xs font-medium text-slate-700">Location</span>
                    <input class="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm" data-field="location" />
                  </label>

                  <label class="block sm:col-span-2">
                    <span class="text-xs font-medium text-slate-700">Links (one per line)</span>
                    <textarea class="mt-1 min-h-18 w-full rounded border border-slate-200 px-3 py-2 text-sm" data-field="links"></textarea>
                  </label>

                  <label class="block sm:col-span-2">
                    <span class="text-xs font-medium text-slate-700">Summary</span>
                    <textarea class="mt-1 min-h-24 w-full rounded border border-slate-200 px-3 py-2 text-sm" data-field="summary"></textarea>
                  </label>
                </div>
              </div>

              <div>
                <div class="flex items-center justify-between gap-3">
                  <h3 class="text-xs font-semibold uppercase tracking-wide text-slate-500">Experience</h3>
                  <button
                    type="button"
                    class="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-900 hover:bg-slate-50"
                    data-action="add-experience"
                  >
                    <i data-lucide="plus" class="h-3.5 w-3.5"></i>
                    Add
                  </button>
                </div>
                <div class="mt-3 space-y-4" data-role="experience-list"></div>
              </div>

              <div>
                <div class="flex items-center justify-between gap-3">
                  <h3 class="text-xs font-semibold uppercase tracking-wide text-slate-500">Education</h3>
                  <button
                    type="button"
                    class="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-900 hover:bg-slate-50"
                    data-action="add-education"
                  >
                    <i data-lucide="plus" class="h-3.5 w-3.5"></i>
                    Add
                  </button>
                </div>
                <div class="mt-3 space-y-4" data-role="education-list"></div>
              </div>

              <div>
                <h3 class="text-xs font-semibold uppercase tracking-wide text-slate-500">Skills (one per line)</h3>
                <textarea class="mt-3 min-h-24 w-full rounded border border-slate-200 px-3 py-2 text-sm" data-field="skills"></textarea>
              </div>
            </div>
          </section>

          <section class="border border-slate-200 bg-white shadow-sm">
            <div class="border-b border-slate-200 px-4 py-3">
              <h2 class="text-sm font-semibold text-slate-900">Preview</h2>
              <p class="mt-1 text-xs text-slate-500">This is the exact HTML that will be printed to PDF.</p>
            </div>
            <div class="bg-slate-100 p-4">
              <div class="overflow-auto border border-slate-200 bg-slate-200 p-3">
                <iframe
                  class="block h-[calc(100vh-210px)] w-full rounded bg-white"
                  data-role="cv-preview"
                  title="CV Preview"
                ></iframe>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  `;

  createIcons({
    icons: {
      ArrowLeft,
      FileDown,
      Plus,
      Trash2,
    },
    nameAttr: "data-lucide",
    root,
  });

  const sourceTextArea = root.querySelector<HTMLTextAreaElement>(
    "[data-role=source-text]"
  );
  const sourceFindInput = root.querySelector<HTMLInputElement>(
    "[data-role=source-find]"
  );
  const sourceFindStatus = root.querySelector<HTMLSpanElement>(
    "[data-role=source-find-status]"
  );

  if (sourceTextArea && typeof model.sourceText === "string") {
    sourceTextArea.value = model.sourceText;

    const copyButton = root.querySelector<HTMLButtonElement>(
      "[data-action=copy-source]"
    );
    copyButton?.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(sourceTextArea.value);
        if (sourceFindStatus) {
          sourceFindStatus.textContent = "Copied.";
        }
      } catch {
        // Fallback for environments where clipboard is blocked.
        sourceTextArea.focus();
        sourceTextArea.select();
        try {
          document.execCommand("copy");
          if (sourceFindStatus) {
            sourceFindStatus.textContent = "Copied.";
          }
        } catch {
          if (sourceFindStatus) {
            sourceFindStatus.textContent = "Copy failed.";
          }
        }
      }
    });

    const findNext = () => {
      const query = sourceFindInput?.value ?? "";
      const needle = query.trim();
      if (!needle) {
        if (sourceFindStatus) {
          sourceFindStatus.textContent = "";
        }
        return;
      }

      const haystack = sourceTextArea.value;
      const start = Math.max(sourceTextArea.selectionEnd ?? 0, 0);
      const idx = haystack.toLowerCase().indexOf(needle.toLowerCase(), start);
      const wrappedIdx = idx === -1 ? haystack.toLowerCase().indexOf(needle.toLowerCase(), 0) : idx;

      if (wrappedIdx === -1) {
        if (sourceFindStatus) {
          sourceFindStatus.textContent = "No matches.";
        }
        return;
      }

      sourceTextArea.focus();
      sourceTextArea.setSelectionRange(wrappedIdx, wrappedIdx + needle.length);
      if (sourceFindStatus) {
        sourceFindStatus.textContent = "Match selected.";
      }
    };

    root
      .querySelector<HTMLButtonElement>("[data-action=source-find-next]")
      ?.addEventListener("click", () => {
        findNext();
      });

    sourceFindInput?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        findNext();
      }
    });
  }

  const backButtons = root.querySelectorAll<HTMLButtonElement | HTMLAnchorElement>(
    '[data-action="back"]'
  );
  for (const button of backButtons) {
    button.addEventListener("click", (e) => {
      e.preventDefault();
      handlers.onBack?.();
    });
  }

  const exportButton = root.querySelector<HTMLButtonElement>(
    '[data-action="export-pdf"]'
  );
  exportButton?.addEventListener("click", async () => {
    if (!handlers.onExportPdf || isExporting) {
      return;
    }
    isExporting = true;
    exportButton.disabled = true;

    try {
      const suggestedFileName = getCvSuggestedFileName(currentCv);
      await handlers.onExportPdf(currentCv, suggestedFileName);
    } finally {
      isExporting = false;
      exportButton.disabled = false;
    }
  });

  type BasicsTextKey = Exclude<keyof CvDocument["basics"], "links">;

  const basicsBindings: Array<[BasicsTextKey, string]> = [
    ["fullName", "fullName"],
    ["headline", "headline"],
    ["email", "email"],
    ["phone", "phone"],
    ["location", "location"],
    ["summary", "summary"],
  ];

  for (const [key, field] of basicsBindings) {
    const input = root.querySelector<HTMLInputElement | HTMLTextAreaElement>(
      `[data-field="${field}"]`
    );
    if (!input) {
      continue;
    }

    input.value = currentCv.basics[key] ?? "";
    input.addEventListener("input", () => {
      const next = cloneCv(currentCv);
      next.basics[key] = input.value;
      setCv(next);
    });
  }

  const linksInput = root.querySelector<HTMLTextAreaElement>(
    '[data-field="links"]'
  );
  if (linksInput) {
    linksInput.value = fromLines(currentCv.basics.links ?? []);
    linksInput.addEventListener("input", () => {
      const next = cloneCv(currentCv);
      next.basics.links = toLines(linksInput.value);
      setCv(next);
    });
  }

  const skillsInput = root.querySelector<HTMLTextAreaElement>(
    '[data-field="skills"]'
  );
  if (skillsInput) {
    skillsInput.value = fromLines(currentCv.skills ?? []);
    skillsInput.addEventListener("input", () => {
      const next = cloneCv(currentCv);
      next.skills = toLines(skillsInput.value);
      setCv(next);
    });
  }

  const renderExperienceList = () => {
    const list = root.querySelector<HTMLDivElement>("[data-role=experience-list]");
    if (!list) {
      return;
    }

    const items = currentCv.experience ?? [];

    list.innerHTML = items
      .map(
        (_item, index) => `
          <div class="rounded border border-slate-200 bg-slate-50 p-3" data-role="exp" data-index="${index}">
            <div class="flex items-center justify-between">
              <h4 class="text-xs font-semibold text-slate-900">Entry ${index + 1}</h4>
              <button
                type="button"
                class="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-900 hover:bg-slate-50"
                data-action="remove-exp"
                data-index="${index}"
              >
                <i data-lucide="trash-2" class="h-3.5 w-3.5"></i>
                Remove
              </button>
            </div>

            <div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label class="block">
                <span class="text-xs font-medium text-slate-700">Role</span>
                <input class="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm" data-exp-field="role" data-index="${index}" />
              </label>
              <label class="block">
                <span class="text-xs font-medium text-slate-700">Company</span>
                <input class="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm" data-exp-field="company" data-index="${index}" />
              </label>
              <label class="block">
                <span class="text-xs font-medium text-slate-700">Location</span>
                <input class="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm" data-exp-field="location" data-index="${index}" />
              </label>
              <label class="block">
                <span class="text-xs font-medium text-slate-700">Start</span>
                <input class="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm" data-exp-field="start" data-index="${index}" placeholder="2024" />
              </label>
              <label class="block">
                <span class="text-xs font-medium text-slate-700">End</span>
                <input class="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm" data-exp-field="end" data-index="${index}" placeholder="Present" />
              </label>
              <label class="block sm:col-span-2">
                <span class="text-xs font-medium text-slate-700">Highlights (one per line)</span>
                <textarea class="mt-1 min-h-21 w-full rounded border border-slate-200 px-3 py-2 text-sm" data-exp-field="highlights" data-index="${index}"></textarea>
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
      getValue: (item: CvExperience) => string,
      setValue: (item: CvExperience, value: string) => void
    ) => {
      const inputs = list.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(selector);
      for (const input of inputs) {
        const indexAttr = input.getAttribute("data-index");
        const index = indexAttr ? Number(indexAttr) : NaN;
        if (!Number.isFinite(index) || !currentCv.experience?.[index]) {
          continue;
        }

        input.value = getValue(currentCv.experience[index]);

        input.addEventListener("input", () => {
          const next = cloneCv(currentCv);
          const item = next.experience[index];
          setValue(item, input.value);
          setCv(next);
        });
      }
    };

    bind('[data-exp-field="role"]', (i) => i.role, (i, v) => {
      i.role = v;
    });
    bind('[data-exp-field="company"]', (i) => i.company, (i, v) => {
      i.company = v;
    });
    bind('[data-exp-field="location"]', (i) => i.location, (i, v) => {
      i.location = v;
    });
    bind('[data-exp-field="start"]', (i) => i.start, (i, v) => {
      i.start = v;
    });
    bind('[data-exp-field="end"]', (i) => i.end, (i, v) => {
      i.end = v;
    });
    bind(
      '[data-exp-field="highlights"]',
      (i) => fromLines(i.highlights ?? []),
      (i, v) => {
        i.highlights = toLines(v);
      }
    );

    const removeButtons = list.querySelectorAll<HTMLButtonElement>(
      "[data-action=remove-exp]"
    );
    for (const button of removeButtons) {
      button.addEventListener("click", () => {
        const indexAttr = button.getAttribute("data-index");
        const index = indexAttr ? Number(indexAttr) : NaN;
        if (!Number.isFinite(index)) {
          return;
        }

        const next = cloneCv(currentCv);
        next.experience.splice(index, 1);
        if (next.experience.length === 0) {
          next.experience.push(emptyExperience());
        }
        setCv(next);
        renderExperienceList();
      });
    }
  };

  const renderEducationList = () => {
    const list = root.querySelector<HTMLDivElement>("[data-role=education-list]");
    if (!list) {
      return;
    }

    const items = currentCv.education ?? [];

    list.innerHTML = items
      .map(
        (_item, index) => `
          <div class="rounded border border-slate-200 bg-slate-50 p-3" data-role="edu" data-index="${index}">
            <div class="flex items-center justify-between">
              <h4 class="text-xs font-semibold text-slate-900">Entry ${index + 1}</h4>
              <button
                type="button"
                class="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-900 hover:bg-slate-50"
                data-action="remove-edu"
                data-index="${index}"
              >
                <i data-lucide="trash-2" class="h-3.5 w-3.5"></i>
                Remove
              </button>
            </div>

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
      getValue: (item: CvEducation) => string,
      setValue: (item: CvEducation, value: string) => void
    ) => {
      const inputs = list.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(selector);
      for (const input of inputs) {
        const indexAttr = input.getAttribute("data-index");
        const index = indexAttr ? Number(indexAttr) : NaN;
        if (!Number.isFinite(index) || !currentCv.education?.[index]) {
          continue;
        }

        input.value = getValue(currentCv.education[index]);

        input.addEventListener("input", () => {
          const next = cloneCv(currentCv);
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
    bind(
      '[data-edu-field="highlights"]',
      (i) => fromLines(i.highlights ?? []),
      (i, v) => {
        i.highlights = toLines(v);
      }
    );

    const removeButtons = list.querySelectorAll<HTMLButtonElement>(
      "[data-action=remove-edu]"
    );
    for (const button of removeButtons) {
      button.addEventListener("click", () => {
        const indexAttr = button.getAttribute("data-index");
        const index = indexAttr ? Number(indexAttr) : NaN;
        if (!Number.isFinite(index)) {
          return;
        }

        const next = cloneCv(currentCv);
        next.education.splice(index, 1);
        if (next.education.length === 0) {
          next.education.push(emptyEducation());
        }
        setCv(next);
        renderEducationList();
      });
    }
  };

  root
    .querySelector<HTMLButtonElement>("[data-action=add-experience]")
    ?.addEventListener("click", () => {
      const next = cloneCv(currentCv);
      next.experience.push(emptyExperience());
      setCv(next);
      renderExperienceList();
    });

  root
    .querySelector<HTMLButtonElement>("[data-action=add-education]")
    ?.addEventListener("click", () => {
      const next = cloneCv(currentCv);
      next.education.push(emptyEducation());
      setCv(next);
      renderEducationList();
    });

  renderExperienceList();
  renderEducationList();
  updatePreview();
  setStatus("saved");
}
