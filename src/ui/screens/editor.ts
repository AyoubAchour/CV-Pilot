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

export interface EditorScreenModel {
  project: ProjectSummary;
  cv: CvDocument;
}

export interface EditorScreenHandlers {
  onBack?: () => void;
  onSave?: (cv: CvDocument) => Promise<void>;
  onExportPdf?: (cv: CvDocument, suggestedFileName: string) => Promise<void>;
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

  const setCv = (next: CvDocument) => {
    currentCv = next;
    preview?.update(currentCv);
    scheduleSave();
    syncOptionalSectionsUi(root, currentCv);
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
}
