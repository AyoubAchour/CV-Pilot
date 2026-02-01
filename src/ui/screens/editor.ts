import {
  ArrowLeft,
  FileDown,
  Plus,
  createIcons,
} from "lucide";

import type { CvDocument } from "../../shared/cv-model";
import { getCvSuggestedFileName } from "../../shared/cv-template";

import { cloneCv, emptyAward, emptyCertification, emptyProject, emptyPublication, emptyVolunteering, fromLines, toLines } from "./editor_internal/helpers";
import { renderEditorHtml } from "./editor_internal/view";
import { createPreviewController } from "./editor_internal/preview";
import { bindSectionToggle, syncOptionalSectionsUi } from "./editor_internal/optional_sections";
import { bindGitHubImportModal } from "./editor_internal/github_import_modal";
import { bindOpenAiSettingsModal } from "./editor_internal/openai_settings_modal";
import { bindAddExperience, renderExperienceList } from "./editor_internal/sections/experience";
import { bindAddEducation, renderEducationList } from "./editor_internal/sections/education";
import { bindAddProject, renderProjectsList } from "./editor_internal/sections/projects";
import { bindAddCertification, renderCertificationsList } from "./editor_internal/sections/certifications";
import { bindAddAward, renderAwardsList } from "./editor_internal/sections/awards";
import { bindAddPublication, renderPublicationsList } from "./editor_internal/sections/publications";
import { bindAddVolunteering, renderVolunteeringList } from "./editor_internal/sections/volunteering";
import type { CvUpdateMeta } from "./editor_internal/cv_update";

export interface EditorScreenModel {
  project: ProjectSummary;
  cv: CvDocument;
}

export interface EditorScreenHandlers {
  onBack?: () => void;
  onSave?: (cv: CvDocument) => Promise<void>;
  onExportPdf?: (cv: CvDocument, suggestedFileName: string) => Promise<void>;
}

function cloneForHistory(cv: CvDocument): CvDocument {
  // Reuse the same deep-ish clone shape used everywhere else.
  return cloneCv(cv);
}

function shouldHandleUndoShortcut(event: KeyboardEvent): boolean {
  const key = event.key.toLowerCase();
  const isZ = key === "z";
  const isY = key === "y";
  const isMac = navigator.platform.toLowerCase().includes("mac");
  const mod = isMac ? event.metaKey : event.ctrlKey;
  return mod && (isZ || isY);
}

function isEditableTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  if (el.isContentEditable) return true;
  return false;
}

export function renderEditorScreen(
  root: HTMLElement,
  model: EditorScreenModel,
  handlers: EditorScreenHandlers = {}
) {
  const listeners = new AbortController();

  let currentCv = cloneCv(model.cv);
  let saveTimer: number | null = null;
  let isSaving = false;
  let isExporting = false;

  const history = {
    past: [] as CvDocument[],
    future: [] as CvDocument[],
    limit: 60,
    // Group typing updates so each field becomes 1 undo step.
    pending: null as null | {
      groupKey: string;
      base: CvDocument;
      timer: number;
    },
  };

  const openExperienceEntries = new Set<number>([0]);
  const openEducationEntries = new Set<number>([0]);

  const getCv = () => currentCv;

  const setStatus = (
    status: "saved" | "unsaved" | "saving" | "error",
    message?: string
  ) => {
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

  let preview: ReturnType<typeof createPreviewController> | null = null;

  const rehydrateUi = () => {
    // Basics fields
    const setFieldValue = (field: string, value: string) => {
      const el = root.querySelector<HTMLInputElement | HTMLTextAreaElement>(
        `[data-field="${field}"]`
      );
      if (el) el.value = value;
    };

    setFieldValue("fullName", currentCv.basics.fullName ?? "");
    setFieldValue("headline", currentCv.basics.headline ?? "");
    setFieldValue("email", currentCv.basics.email ?? "");
    setFieldValue("phone", currentCv.basics.phone ?? "");
    setFieldValue("location", currentCv.basics.location ?? "");
    setFieldValue("summary", currentCv.basics.summary ?? "");
    setFieldValue("links", fromLines(currentCv.basics.links ?? []));
    setFieldValue("skills", fromLines(currentCv.skills ?? []));
  };

  const pushHistory = (base: CvDocument) => {
    history.past.push(cloneForHistory(base));
    if (history.past.length > history.limit) {
      history.past.splice(0, history.past.length - history.limit);
    }
    history.future = [];
  };

  const flushTypingGroup = () => {
    if (!history.pending) return;
    window.clearTimeout(history.pending.timer);
    pushHistory(history.pending.base);
    history.pending = null;
  };

  // Assigned after the header buttons are in the DOM.
  // Kept as a mutable function so `setCv()` can enable/disable undo/redo immediately.
  let updateUndoRedoUi = () => {
    // no-op until the header buttons are rendered
    return;
  };

  const setCv = (next: CvDocument, meta: CvUpdateMeta = {}) => {
    const kind = meta.kind ?? "typing";
    const groupKey = (meta.groupKey ?? "").trim();

    if (kind === "typing" && groupKey) {
      if (history.pending && history.pending.groupKey !== groupKey) {
        flushTypingGroup();
      }
      if (!history.pending) {
        history.pending = {
          groupKey,
          base: cloneForHistory(currentCv),
          timer: window.setTimeout(() => {
            flushTypingGroup();
            updateUndoRedoUi();
          }, 750),
        };
      } else {
        window.clearTimeout(history.pending.timer);
        history.pending.timer = window.setTimeout(() => {
          flushTypingGroup();
          updateUndoRedoUi();
        }, 750);
      }
    } else {
      flushTypingGroup();
      pushHistory(currentCv);
    }

    currentCv = next;
    preview?.update(currentCv);
    scheduleSave();
    syncOptionalSectionsUi(root, currentCv);

    // Enable Undo immediately after any change (typing groups or structural updates).
    updateUndoRedoUi();
  };

  root.innerHTML = renderEditorHtml(model, currentCv);

  createIcons({
    icons: {
      ArrowLeft,
      FileDown,
      Plus,
    },
    nameAttr: "data-lucide",
    root,
  });

  preview = createPreviewController(root);

  const undoButton = root.querySelector<HTMLButtonElement>(
    '[data-action="undo"]'
  );
  const redoButton = root.querySelector<HTMLButtonElement>(
    '[data-action="redo"]'
  );

  updateUndoRedoUi = () => {
    const canUndo = history.past.length > 0 || history.pending !== null;
    const canRedo = history.future.length > 0;
    if (undoButton) undoButton.disabled = !canUndo;
    if (redoButton) redoButton.disabled = !canRedo;
  };

  const undo = () => {
    flushTypingGroup();
    const prev = history.past.pop();
    if (!prev) {
      updateUndoRedoUi();
      return;
    }
    history.future.push(cloneForHistory(currentCv));
    currentCv = cloneForHistory(prev);
    preview?.update(currentCv);
    // Re-render dynamic lists + inputs
    renderExperience();
    renderEducation();
    renderProjects();
    renderCertifications();
    renderAwards();
    renderPublications();
    renderVolunteering();
    syncOptionalSectionsUi(root, currentCv);
    rehydrateUi();
    scheduleSave();
    updateUndoRedoUi();
  };

  const redo = () => {
    flushTypingGroup();
    const next = history.future.pop();
    if (!next) {
      updateUndoRedoUi();
      return;
    }
    history.past.push(cloneForHistory(currentCv));
    currentCv = cloneForHistory(next);
    preview?.update(currentCv);
    renderExperience();
    renderEducation();
    renderProjects();
    renderCertifications();
    renderAwards();
    renderPublications();
    renderVolunteering();
    syncOptionalSectionsUi(root, currentCv);
    rehydrateUi();
    scheduleSave();
    updateUndoRedoUi();
  };

  undoButton?.addEventListener("click", (e) => {
    e.preventDefault();
    undo();
  });
  redoButton?.addEventListener("click", (e) => {
    e.preventDefault();
    redo();
  });

  const keyHandler = (event: KeyboardEvent) => {
    if (!shouldHandleUndoShortcut(event)) return;
    if (!isEditableTarget(event.target)) return;
    const key = event.key.toLowerCase();
    const isMac = navigator.platform.toLowerCase().includes("mac");
    const mod = isMac ? event.metaKey : event.ctrlKey;
    if (!mod) return;

    if (key === "z" && event.shiftKey) {
      event.preventDefault();
      redo();
      return;
    }

    if (key === "z") {
      event.preventDefault();
      undo();
      return;
    }

    if (key === "y") {
      event.preventDefault();
      redo();
    }
  };
  window.addEventListener("keydown", keyHandler, { signal: listeners.signal });

  const backButtons = root.querySelectorAll<HTMLButtonElement | HTMLAnchorElement>(
    '[data-action="back"]'
  );
  for (const button of backButtons) {
    button.addEventListener("click", (e) => {
      e.preventDefault();
      listeners.abort();
      handlers.onBack?.();
    });
  }

  const sidebarSectionLinks = root.querySelectorAll<HTMLAnchorElement>(
    'aside nav a[href^="#section-"]'
  );
  for (const link of sidebarSectionLinks) {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const href = link.getAttribute("href") ?? "";
      const id = href.startsWith("#") ? href.slice(1) : "";
      if (!id) return;

      const section = root.querySelector<HTMLElement>(`#${id}`);
      if (!section) return;

      const details = section.closest("details");
      if (details) {
        details.open = true;
      }

      section.scrollIntoView({ block: "start", behavior: "smooth" });
    }, { signal: listeners.signal });
  }

  const editorRootSummaries = root.querySelectorAll<HTMLElement>(
    'main summary'
  );
  for (const summary of editorRootSummaries) {
    summary.addEventListener(
      "click",
      (e) => {
        // Do not toggle <details> if user is clicking an interactive control inside the summary.
        const target = e.target as HTMLElement | null;
        if (target?.closest("button, a, input, label, select, textarea")) {
          e.preventDefault();
          e.stopPropagation();
        }
      },
      { signal: listeners.signal }
    );
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

  bindOpenAiSettingsModal({ root });

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
      setCv(next, { kind: "typing", groupKey: `basics.${field}` });
    });
  }

  const summaryInput = root.querySelector<HTMLTextAreaElement>(
    '[data-field="summary"]'
  );
  const generateSummaryButton = root.querySelector<HTMLButtonElement>(
    '[data-action="generate-summary"]'
  );
  const summaryAiStatus = root.querySelector<HTMLSpanElement>(
    '[data-role="summary-ai-status"]'
  );
  const undoSummaryButton = root.querySelector<HTMLButtonElement>(
    '[data-action="undo-summary-ai"]'
  );

  let isGeneratingSummary = false;
  let lastSummaryUndo: string | null = null;

  const setSummaryAiUi = (state: {
    busy?: boolean;
    statusText?: string;
    canUndo?: boolean;
  }) => {
    if (generateSummaryButton) {
      const busy = state.busy === true;
      generateSummaryButton.disabled = busy;
      generateSummaryButton.textContent = busy ? "Generating…" : "Generate with AI";
    }

    if (summaryAiStatus) {
      summaryAiStatus.textContent = state.statusText ?? "";
    }

    if (undoSummaryButton) {
      const canUndo = state.canUndo === true;
      undoSummaryButton.classList.toggle("hidden", !canUndo);
    }
  };

  undoSummaryButton?.addEventListener("click", () => {
    if (lastSummaryUndo === null) return;
    const next = cloneCv(currentCv);
    next.basics.summary = lastSummaryUndo;
    setCv(next, { kind: "structural", groupKey: "basics.summary" });
    if (summaryInput) {
      summaryInput.value = next.basics.summary;
    }
    lastSummaryUndo = null;
    setSummaryAiUi({ statusText: "Reverted summary.", canUndo: false });
  });

  generateSummaryButton?.addEventListener("click", async () => {
    if (isGeneratingSummary) return;

    const cv = getCv();

    const hasAnyHighlights = (lines: Array<string | null | undefined>) =>
      (lines ?? []).some((l) => (l ?? "").trim().length > 0);

    const hasContent =
      (cv.basics.headline ?? "").trim().length > 0 ||
      (cv.skills ?? []).some((s) => s.trim().length > 0) ||
      (cv.experience ?? []).some((e) => hasAnyHighlights(e.highlights)) ||
      (cv.projects ?? []).some((p) => hasAnyHighlights(p.highlights));

    if (!hasContent) {
      setSummaryAiUi({
        statusText:
          "Add a headline, skills, or at least one highlight first, then try again.",
        canUndo: false,
      });
      return;
    }

    const existingSummary = (cv.basics.summary ?? "").trim();
    if (existingSummary.length > 0) {
      const ok = window.confirm("Replace your existing summary with an AI draft?");
      if (!ok) return;
    }

    setSummaryAiUi({ statusText: "Checking OpenAI settings…", canUndo: false });
    let status: OpenAiStatus;
    try {
      status = await window.cvPilot.openaiGetStatus();
    } catch (err) {
      const raw = err instanceof Error ? err.message : "Failed to load OpenAI settings.";
      const needsRestart = raw.includes("No handler registered") || raw.includes("openaiGetStatus");
      setSummaryAiUi({
        statusText: needsRestart
          ? "OpenAI features require restarting the Electron app."
          : raw,
        canUndo: false,
      });
      return;
    }

    if (!status.storageAvailable) {
      setSummaryAiUi({
        statusText: "OpenAI cannot be configured on this system (secure storage unavailable).",
        canUndo: false,
      });
      return;
    }

    if (!status.configured) {
      setSummaryAiUi({ statusText: "OpenAI API key is missing. Open AI Settings to configure.", canUndo: false });
      window.dispatchEvent(new Event("cvpilot:openai-settings"));
      return;
    }

    const toLines = (value: string[]): string[] =>
      (value ?? []).map((v) => v.trim()).filter((v) => v.length > 0);

    const context: OpenAiGenerateSummaryFromCvInput = {
      headline: (cv.basics.headline ?? "").trim() || null,
      skills: toLines(cv.skills ?? []).slice(0, 18),
      experience: (cv.experience ?? [])
        .map((e) => ({
          role: (e.role ?? "").trim(),
          company: (e.company ?? "").trim(),
          highlights: toLines(e.highlights ?? []).slice(0, 4),
        }))
        .filter((e) => e.role.length > 0 || e.company.length > 0 || e.highlights.length > 0)
        .slice(0, 6),
      projects: (cv.projects ?? [])
        .map((p) => ({
          title: (p.title ?? "").trim(),
          highlights: toLines(p.highlights ?? []).slice(0, 4),
        }))
        .filter((p) => p.title.length > 0 || p.highlights.length > 0)
        .slice(0, 6),
      education: (cv.education ?? [])
        .map((ed) => ({
          school: (ed.school ?? "").trim(),
          degree: (ed.degree ?? "").trim(),
        }))
        .filter((ed) => ed.school.length > 0 || ed.degree.length > 0)
        .slice(0, 3),
    };

    isGeneratingSummary = true;
    setSummaryAiUi({ busy: true, statusText: "Generating summary…", canUndo: false });

    try {
      const result = await window.cvPilot.openaiGenerateSummaryFromCv(context);
      const summary = (result.summary ?? "").trim();
      if (!summary) {
        throw new Error("OpenAI returned an empty summary.");
      }

      lastSummaryUndo = currentCv.basics.summary ?? "";
      const next = cloneCv(currentCv);
      next.basics.summary = summary;
      setCv(next, { kind: "structural", groupKey: "basics.summary" });
      if (summaryInput) {
        summaryInput.value = summary;
      }

      const note = (result.notes ?? []).map((n) => n.trim()).filter(Boolean)[0] ?? "";
      setSummaryAiUi({
        statusText: note ? `Inserted AI draft. ${note}` : "Inserted AI draft summary.",
        canUndo: true,
      });
    } catch (err) {
      setSummaryAiUi({
        statusText: err instanceof Error ? err.message : "Failed to generate summary.",
        canUndo: false,
      });
    } finally {
      isGeneratingSummary = false;
      setSummaryAiUi({ busy: false });
    }
  });

  const linksInput = root.querySelector<HTMLTextAreaElement>(
    '[data-field="links"]'
  );
  if (linksInput) {
    linksInput.value = fromLines(currentCv.basics.links ?? []);
    linksInput.addEventListener("input", () => {
      const next = cloneCv(currentCv);
      next.basics.links = toLines(linksInput.value);
      setCv(next, { kind: "typing", groupKey: "basics.links" });
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
      setCv(next, { kind: "typing", groupKey: "skills" });
    });
  }

  const renderExperience = () =>
    renderExperienceList({
      root,
      getCv,
      setCv,
      openEntries: openExperienceEntries,
    });
  const renderEducation = () =>
    renderEducationList({
      root,
      getCv,
      setCv,
      openEntries: openEducationEntries,
    });
  const renderProjects = () => renderProjectsList({ root, getCv, setCv });
  const renderCertifications = () =>
    renderCertificationsList({ root, getCv, setCv });
  const renderAwards = () => renderAwardsList({ root, getCv, setCv });
  const renderPublications = () => renderPublicationsList({ root, getCv, setCv });
  const renderVolunteering = () => renderVolunteeringList({ root, getCv, setCv });

  bindGitHubImportModal({
    root,
    getCv,
    setCv,
    onApplied: (prevCv, nextCv) => {
      // This is a structural update applied programmatically.
      setCv(cloneCv(nextCv), { kind: "structural", groupKey: "github-import" });

      // Programmatic CV updates (from GitHub import) do not automatically re-render list UIs.
      renderProjects();

      const setFieldValue = (field: string, value: string) => {
        const el = root.querySelector<HTMLInputElement | HTMLTextAreaElement>(
          `[data-field="${field}"]`
        );
        if (el) {
          el.value = value;
        }
      };

      setFieldValue("fullName", nextCv.basics.fullName ?? "");
      setFieldValue("location", nextCv.basics.location ?? "");
      setFieldValue("links", fromLines(nextCv.basics.links ?? []));

      if (skillsInput) {
        skillsInput.value = fromLines(nextCv.skills ?? []);
      }

      if (!prevCv.sections.projects && nextCv.sections.projects) {
        const details = root.querySelector<HTMLDetailsElement>(
          '[data-role="section-projects"]'
        );
        if (details) {
          details.open = true;
        }
      }
    },
  });

  bindAddExperience({
    root,
    getCv,
    setCv,
    openEntries: openExperienceEntries,
    render: renderExperience,
  });
  bindAddEducation({
    root,
    getCv,
    setCv,
    openEntries: openEducationEntries,
    render: renderEducation,
  });
  bindAddProject({ root, getCv, setCv, render: renderProjects });
  bindAddCertification({ root, getCv, setCv, render: renderCertifications });
  bindAddAward({ root, getCv, setCv, render: renderAwards });
  bindAddPublication({ root, getCv, setCv, render: renderPublications });
  bindAddVolunteering({ root, getCv, setCv, render: renderVolunteering });

  bindSectionToggle({
    root,
    key: "projects",
    selector: '[data-field="toggle-projects"]',
    getCv,
    cloneCv,
    setCv,
    ensureOnEnable: (cv) => {
      if ((cv.projects ?? []).length === 0) {
        cv.projects = [emptyProject()];
      }
    },
    renderList: renderProjects,
  });

  bindSectionToggle({
    root,
    key: "certifications",
    selector: '[data-field="toggle-certifications"]',
    getCv,
    cloneCv,
    setCv,
    ensureOnEnable: (cv) => {
      if ((cv.certifications ?? []).length === 0) {
        cv.certifications = [emptyCertification()];
      }
    },
    renderList: renderCertifications,
  });

  bindSectionToggle({
    root,
    key: "awards",
    selector: '[data-field="toggle-awards"]',
    getCv,
    cloneCv,
    setCv,
    ensureOnEnable: (cv) => {
      if ((cv.awards ?? []).length === 0) {
        cv.awards = [emptyAward()];
      }
    },
    renderList: renderAwards,
  });

  bindSectionToggle({
    root,
    key: "publications",
    selector: '[data-field="toggle-publications"]',
    getCv,
    cloneCv,
    setCv,
    ensureOnEnable: (cv) => {
      if ((cv.publications ?? []).length === 0) {
        cv.publications = [emptyPublication()];
      }
    },
    renderList: renderPublications,
  });

  bindSectionToggle({
    root,
    key: "volunteering",
    selector: '[data-field="toggle-volunteering"]',
    getCv,
    cloneCv,
    setCv,
    ensureOnEnable: (cv) => {
      if ((cv.volunteering ?? []).length === 0) {
        cv.volunteering = [emptyVolunteering()];
      }
    },
    renderList: renderVolunteering,
  });

  renderExperience();
  renderEducation();
  renderProjects();
  renderCertifications();
  renderAwards();
  renderPublications();
  renderVolunteering();

  syncOptionalSectionsUi(root, currentCv);
  preview.update(currentCv);
  setStatus("saved");
  updateUndoRedoUi();
}
