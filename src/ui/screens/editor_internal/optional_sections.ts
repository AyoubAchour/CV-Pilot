import type { CvDocument } from "../../../shared/cv-model";

export function syncOptionalSectionsUi(root: HTMLElement, cv: CvDocument) {
  const configs: Array<{
    key: keyof CvDocument["sections"];
    count: (cv: CvDocument) => number;
    emptyHint: string;
  }> = [
    {
      key: "projects",
      count: (next) => next.projects?.length ?? 0,
      emptyHint: "No entries yet",
    },
    {
      key: "certifications",
      count: (next) => next.certifications?.length ?? 0,
      emptyHint: "No entries yet",
    },
    {
      key: "awards",
      count: (next) => next.awards?.length ?? 0,
      emptyHint: "No entries yet",
    },
    {
      key: "publications",
      count: (next) => next.publications?.length ?? 0,
      emptyHint: "No entries yet",
    },
    {
      key: "volunteering",
      count: (next) => next.volunteering?.length ?? 0,
      emptyHint: "No entries yet",
    },
  ];

  for (const cfg of configs) {
    const enabled = cv.sections?.[cfg.key] ?? false;

    const checkbox = root.querySelector<HTMLInputElement>(
      `[data-field="toggle-${cfg.key}"]`
    );
    if (checkbox) {
      checkbox.checked = enabled;
    }

    const details = root.querySelector<HTMLDetailsElement>(
      `[data-role="section-${cfg.key}"]`
    );
    if (details) {
      details.classList.toggle("opacity-80", !enabled);
    }

    const meta = root.querySelector<HTMLDivElement>(`[data-role="meta-${cfg.key}"]`);
    if (meta) {
      const n = cfg.count(cv);
      const countText = n === 1 ? "1 entry" : `${n} entries`;
      if (enabled) {
        meta.textContent = n > 0 ? countText : cfg.emptyHint;
      } else {
        meta.textContent = n > 0 ? `Hidden (${countText} saved)` : "Hidden";
      }
    }
  }

  const expMeta = root.querySelector<HTMLDivElement>("[data-role=meta-experience]");
  if (expMeta) {
    const n = cv.experience?.length ?? 0;
    expMeta.textContent = n === 1 ? "1 entry" : `${n} entries`;
  }

  const eduMeta = root.querySelector<HTMLDivElement>("[data-role=meta-education]");
  if (eduMeta) {
    const n = cv.education?.length ?? 0;
    eduMeta.textContent = n === 1 ? "1 entry" : `${n} entries`;
  }
}

export function bindSectionToggle(options: {
  root: HTMLElement;
  key: keyof CvDocument["sections"];
  selector: string;
  getCv: () => CvDocument;
  cloneCv: (cv: CvDocument) => CvDocument;
  setCv: (next: CvDocument) => void;
  ensureOnEnable: (cv: CvDocument) => void;
  renderList: () => void;
}) {
  const { root, key, selector, getCv, cloneCv, setCv, ensureOnEnable, renderList } = options;

  const checkbox = root.querySelector<HTMLInputElement>(selector);
  if (!checkbox) {
    return;
  }

  // Prevent clicks on the toggle from collapsing/expanding the <details>.
  root
    .querySelector<HTMLElement>(`[data-role="toggle-${key}"]`)
    ?.addEventListener("click", (e) => {
      e.stopPropagation();
    });

  checkbox.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  checkbox.checked = getCv().sections?.[key] ?? false;

  checkbox.addEventListener("change", () => {
    const currentCv = getCv();
    const next = cloneCv(currentCv);
    next.sections[key] = checkbox.checked;

    if (checkbox.checked) {
      ensureOnEnable(next);
    }

    setCv(next);

    const details = root.querySelector<HTMLDetailsElement>(`[data-role="section-${key}"]`);
    if (details && checkbox.checked) {
      details.open = true;
    }

    if (checkbox.checked) {
      renderList();
    }
  });
}
