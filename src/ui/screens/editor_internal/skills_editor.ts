import type { CvDocument } from "../../../shared/cv-model";
import type { OpenAiGenerateSkillsFromCvInput, OpenAiStatus } from "../../../shared/openai-types";
import { cloneCv } from "./helpers";
import type { SetCv } from "./cv_update";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeSkill(raw: string): string {
  // Trim + collapse whitespace.
  return raw.replace(/\s+/g, " ").trim();
}

function sanitizeSkills(list: string[] | null | undefined): string[] {
  return (list ?? []).map(normalizeSkill).filter((s) => s.length > 0);
}

function splitSkillText(raw: string): string[] {
  // Accept newline / comma / semicolon / tab separated lists.
  return raw
    .split(/[\n,;\t]+/g)
    .map(normalizeSkill)
    .filter((s) => s.length > 0);
}

function dedupeCaseInsensitive(list: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of list) {
    const key = item.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

export function renderSkillsEditor(root: HTMLElement, cv: CvDocument) {
  const chips = root.querySelector<HTMLDivElement>("[data-role=skills-chips]");
  if (!chips) return;

  const skills = sanitizeSkills(cv.skills);

  const meta = root.querySelector<HTMLSpanElement>("[data-role=meta-skills]");
  if (meta) {
    meta.textContent = skills.length === 1 ? "1 skill" : `${skills.length} skills`;
  }

  if (skills.length === 0) {
    chips.innerHTML = `
      <div class="w-full border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-xs text-slate-600">
        Add 10–16 concrete keywords recruiters search for (tools, languages, platforms, methods).
      </div>
    `;
    return;
  }

  chips.innerHTML = skills
    .map(
      (skill, index) => `
        <div class="inline-flex items-center border border-slate-200 bg-slate-50 text-slate-900 text-xs">
          <button
            type="button"
            data-action="edit-skill"
            data-index="${index}"
            class="px-2 py-1 text-left hover:bg-slate-100 transition-colors"
            title="Edit"
          >${escapeHtml(skill)}</button>
          <button
            type="button"
            data-action="remove-skill"
            data-index="${index}"
            class="px-2 py-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            aria-label="Remove skill"
            title="Remove"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
      `
    )
    .join("");
}

export function bindSkillsEditor(options: {
  root: HTMLElement;
  getCv: () => CvDocument;
  setCv: SetCv;
}) {
  const { root, getCv, setCv } = options;

  const input = root.querySelector<HTMLInputElement>("[data-field=skills-input]");
  const addButton = root.querySelector<HTMLButtonElement>(
    "[data-action=skills-add]"
  );
  const generateButton = root.querySelector<HTMLButtonElement>(
    "[data-action=generate-skills]"
  );
  const skillsAiStatus = root.querySelector<HTMLDivElement>(
    "[data-role=skills-ai-status]"
  );
  const undoAiButton = root.querySelector<HTMLButtonElement>(
    "[data-action=undo-skills-ai]"
  );
  const chips = root.querySelector<HTMLDivElement>("[data-role=skills-chips]");
  const hint = root.querySelector<HTMLDivElement>("[data-role=skills-hint]");

  if (!input || !chips) {
    return;
  }

  let editingIndex: number | null = null;
  let isGenerating = false;
  let lastAiUndo: string[] | null = null;

  const setEditingHint = (enabled: boolean, label?: string) => {
    if (!hint) return;
    hint.classList.toggle("hidden", !enabled);
    hint.textContent = enabled
      ? label ?? "Editing: press Enter to update"
      : "";
  };

  const commitSkills = (skills: string[]) => {
    const next = cloneCv(getCv());
    next.skills = skills;
    setCv(next, { kind: "structural", groupKey: "skills" });
    renderSkillsEditor(root, next);
  };

  const setSkillsAiUi = (state: {
    busy?: boolean;
    statusText?: string;
    canUndo?: boolean;
  }) => {
    if (generateButton) {
      const busy = state.busy === true;
      generateButton.disabled = busy;
      generateButton.textContent = busy ? "Generating…" : "Generate with AI";
    }

    if (skillsAiStatus) {
      skillsAiStatus.textContent = state.statusText ?? "";
    }

    if (undoAiButton) {
      const canUndo = state.canUndo === true;
      undoAiButton.classList.toggle("hidden", !canUndo);
    }
  };

  const addFromText = (text: string) => {
    const incoming = splitSkillText(text);
    if (incoming.length === 0) return;

    const current = sanitizeSkills(getCv().skills);
    const merged = dedupeCaseInsensitive([...current, ...incoming]);
    editingIndex = null;
    setEditingHint(false);
    input.value = "";
    commitSkills(merged);
  };

  const applyEdit = (text: string) => {
    const replacement = normalizeSkill(text);
    if (!replacement) return;

    const current = sanitizeSkills(getCv().skills);
    if (editingIndex === null || editingIndex < 0 || editingIndex >= current.length) {
      // Fallback: treat as add.
      addFromText(text);
      return;
    }

    const out: string[] = [];
    const replacementKey = replacement.toLowerCase();
    for (let i = 0; i < current.length; i++) {
      const value = i === editingIndex ? replacement : current[i];
      if (value.length === 0) continue;
      // Deduplicate, but allow the edited item to replace itself.
      const key = value.toLowerCase();
      if (key === replacementKey) {
        // ensure only one copy
        if (out.some((x) => x.toLowerCase() === replacementKey)) continue;
      } else {
        if (out.some((x) => x.toLowerCase() === key)) continue;
      }
      out.push(value);
    }

    editingIndex = null;
    setEditingHint(false);
    input.value = "";
    commitSkills(out);
  };

  const removeAt = (index: number) => {
    const current = sanitizeSkills(getCv().skills);
    if (index < 0 || index >= current.length) return;
    current.splice(index, 1);
    editingIndex = null;
    setEditingHint(false);
    commitSkills(current);
  };

  addButton?.addEventListener("click", (e) => {
    e.preventDefault();
    if (editingIndex !== null) {
      applyEdit(input.value);
    } else {
      addFromText(input.value);
    }
  });

  undoAiButton?.addEventListener("click", (e) => {
    e.preventDefault();
    if (!lastAiUndo) return;
    commitSkills(lastAiUndo);
    lastAiUndo = null;
    setSkillsAiUi({ statusText: "Reverted AI skills.", canUndo: false });
  });

  const hasAnyHighlights = (lines: Array<string | null | undefined>) =>
    (lines ?? []).some((l) => (l ?? "").trim().length > 0);

  const toShortLines = (value: string[]): string[] =>
    (value ?? []).map((v) => v.trim()).filter((v) => v.length > 0);

  const buildAiInput = (): OpenAiGenerateSkillsFromCvInput => {
    const cv = getCv();
    return {
      headline: (cv.basics.headline ?? "").trim() || null,
      existingSkills: sanitizeSkills(cv.skills),
      experience: (cv.experience ?? [])
        .map((e) => ({
          role: (e.role ?? "").trim(),
          company: (e.company ?? "").trim(),
          highlights: toShortLines(e.highlights ?? []),
        }))
        .filter((e) => e.role.length > 0 || e.company.length > 0 || e.highlights.length > 0)
        .slice(0, 6),
      projects: (cv.projects ?? [])
        .map((p) => ({
          title: (p.title ?? "").trim(),
          highlights: toShortLines(p.highlights ?? []),
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
  };

  const loadOpenAiStatus = async (): Promise<OpenAiStatus | null> => {
    try {
      return await window.cvPilot.openaiGetStatus();
    } catch (err) {
      const raw = err instanceof Error ? err.message : "Failed to load OpenAI settings.";
      const needsRestart =
        raw.includes("No handler registered") || raw.includes("openaiGetStatus");
      setSkillsAiUi({
        statusText: needsRestart
          ? "OpenAI features require restarting the Electron app."
          : raw,
        canUndo: lastAiUndo !== null,
      });
      return null;
    }
  };

  const generateWithAi = async () => {
    if (isGenerating) return;

    const cv = getCv();
    const hasContent =
      (cv.basics.headline ?? "").trim().length > 0 ||
      (cv.skills ?? []).some((s) => s.trim().length > 0) ||
      (cv.experience ?? []).some((e) => hasAnyHighlights(e.highlights)) ||
      (cv.projects ?? []).some((p) => hasAnyHighlights(p.highlights));

    if (!hasContent) {
      setSkillsAiUi({
        statusText:
          "Add a headline, skills, or at least one highlight first, then try again.",
        canUndo: lastAiUndo !== null,
      });
      return;
    }

    setSkillsAiUi({ statusText: "Checking OpenAI settings…", canUndo: lastAiUndo !== null });
    const status = await loadOpenAiStatus();
    if (!status) return;
    if (!status.storageAvailable) {
      setSkillsAiUi({
        statusText:
          "OpenAI cannot be configured on this system (secure storage unavailable).",
        canUndo: lastAiUndo !== null,
      });
      return;
    }
    if (!status.configured) {
      setSkillsAiUi({
        statusText: "OpenAI API key is missing. Open AI Settings to configure.",
        canUndo: lastAiUndo !== null,
      });
      window.dispatchEvent(new Event("cvpilot:openai-settings"));
      return;
    }

    const existing = sanitizeSkills(cv.skills);

    let mode: "merge" | "replace" = "merge";
    if (existing.length > 0) {
      const mergeOk = window.confirm(
        "Merge AI suggestions into your existing skills?"
      );
      if (mergeOk) {
        mode = "merge";
      } else {
        const replaceOk = window.confirm(
          "Replace your existing skills with AI suggestions?"
        );
        if (!replaceOk) {
          setSkillsAiUi({ statusText: "Canceled.", canUndo: lastAiUndo !== null });
          return;
        }
        mode = "replace";
      }
    }

    isGenerating = true;
    setSkillsAiUi({ busy: true, statusText: "Generating skills…", canUndo: false });

    try {
      const ai = await window.cvPilot.openaiGenerateSkillsFromCv(buildAiInput());
      const suggested = dedupeCaseInsensitive(sanitizeSkills(ai.skills));
      if (suggested.length === 0) {
        throw new Error("OpenAI returned no usable skills.");
      }

      lastAiUndo = [...existing];

      const merged =
        mode === "merge"
          ? dedupeCaseInsensitive([...existing, ...suggested])
          : suggested;

      // Keep the list compact.
      commitSkills(merged.slice(0, 18));

      const note = (ai.notes ?? []).map((n) => n.trim()).filter(Boolean)[0] ?? "";
      setSkillsAiUi({
        statusText: note
          ? `Inserted AI skills. ${note}`
          : mode === "merge"
            ? "Merged AI skills into your list."
            : "Replaced skills with AI suggestions.",
        canUndo: true,
      });
    } catch (err) {
      setSkillsAiUi({
        statusText: err instanceof Error ? err.message : "Failed to generate skills.",
        canUndo: lastAiUndo !== null,
      });
    } finally {
      isGenerating = false;
      setSkillsAiUi({ busy: false, canUndo: lastAiUndo !== null });
    }
  };

  generateButton?.addEventListener("click", (e) => {
    e.preventDefault();
    void generateWithAi();
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (editingIndex !== null) {
        applyEdit(input.value);
      } else {
        addFromText(input.value);
      }
      return;
    }

    if (e.key === "Escape" && editingIndex !== null) {
      e.preventDefault();
      editingIndex = null;
      setEditingHint(false);
      input.value = "";
      return;
    }

    if (e.key === "Backspace" && input.value.length === 0) {
      const current = sanitizeSkills(getCv().skills);
      if (current.length > 0) {
        e.preventDefault();
        removeAt(current.length - 1);
      }
    }
  });

  input.addEventListener("paste", (e) => {
    const text = e.clipboardData?.getData("text") ?? "";
    // Only intercept pastes that look like lists.
    if (!/[\n,;\t]/.test(text)) return;
    e.preventDefault();
    addFromText(text);
  });

  chips.addEventListener("click", (e) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;

    const remove = target.closest<HTMLElement>("[data-action=remove-skill]");
    if (remove) {
      const indexAttr = remove.getAttribute("data-index");
      const index = indexAttr ? Number(indexAttr) : NaN;
      if (!Number.isFinite(index)) return;
      removeAt(index);
      input.focus();
      return;
    }

    const edit = target.closest<HTMLElement>("[data-action=edit-skill]");
    if (edit) {
      const indexAttr = edit.getAttribute("data-index");
      const index = indexAttr ? Number(indexAttr) : NaN;
      if (!Number.isFinite(index)) return;
      const current = sanitizeSkills(getCv().skills);
      if (!current[index]) return;
      editingIndex = index;
      input.value = current[index];
      input.focus();
      input.setSelectionRange(0, input.value.length);
      setEditingHint(true, "Editing: press Enter to update (Esc to cancel)");
    }
  });

  // Initial paint.
  renderSkillsEditor(root, getCv());
}

