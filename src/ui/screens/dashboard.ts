import {
  FolderOpen,
  LayoutDashboard,
  FileText,
  FileDown,
  Plus,
  Search,
  MoreVertical,
  Clock,
  FilePlus,
  Trash2,
  Pencil,
  createIcons,
} from "lucide";

export interface DashboardScreenHandlers {
  onCreateCv?: () => void;
  onOpenProject?: (projectId: string) => void;
  onQuickExport?: (projectId: string) => void;
  onDeleteProject?: (projectId: string) => void;
  onRenameProject?: (projectId: string, newTitle: string) => Promise<void>;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface Project {
  id: string;
  title: string;
  customTitle?: string;
  lastEdited: string;
  tags: string[];
}

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  } catch {
    return dateString;
  }
}

function getTagColor(tag: string): string {
  const colors: Record<string, string> = {
    cv: "bg-blue-50 text-blue-700 border-blue-200",
    draft: "bg-amber-50 text-amber-700 border-amber-200",
    final: "bg-emerald-50 text-emerald-700 border-emerald-200",
    template: "bg-purple-50 text-purple-700 border-purple-200",
  };
  return colors[tag.toLowerCase()] || "bg-slate-50 text-slate-700 border-slate-200";
}

function renderProjectCard(project: Project): string {
  const tagsHtml = project.tags
    .map(
      (tag) =>
        `<span class="inline-flex items-center px-2 py-0.5 text-xs font-medium border ${getTagColor(tag)}">${escapeHtml(
          tag
        )}</span>`
    )
    .join("");

  return `
    <div
      class="group relative w-full bg-white border border-slate-200 transition-colors duration-150 hover:border-slate-300 hover:bg-slate-50"
      data-action="open-project"
      data-project-id="${escapeHtml(project.id)}"
      role="button"
      tabindex="0"
    >
      <div class="p-5">
        <!-- Card Header -->
        <div class="flex items-start justify-between gap-3">
          <div class="flex-1 min-w-0">
            <!-- Editable Title -->
            <div class="w-full max-w-[65%]" data-role="title-container" data-project-id="${escapeHtml(project.id)}">
              <h3 
                class="text-base font-semibold text-slate-900 group-hover:text-blue-600 transition-colors cursor-text hover:bg-blue-50/50 px-1 rounded whitespace-normal wrap-break-word leading-snug"
                data-role="project-title"
                data-project-id="${escapeHtml(project.id)}"
                title="Click to rename"
              >${escapeHtml(project.title)}</h3>
              <textarea
                rows="1"
                class="hidden w-full text-base font-semibold text-slate-900 bg-white border border-transparent px-1 resize-none overflow-hidden whitespace-normal wrap-break-word leading-snug"
                data-role="title-input"
                data-project-id="${escapeHtml(project.id)}"
              >${escapeHtml(project.title)}</textarea>
            </div>
            <div class="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
              <i data-lucide="clock" class="h-3 w-3"></i>
              <span>${escapeHtml(formatRelativeTime(project.lastEdited))}</span>
            </div>
          </div>
          <div class="text-slate-400">
            <i data-lucide="more-vertical" class="h-4 w-4"></i>
          </div>
        </div>

        <!-- Tags -->
        <div class="mt-4 flex flex-wrap gap-1.5">
          ${tagsHtml}
        </div>

        <!-- Preview hint -->
        <div class="mt-4 pt-4 border-t border-slate-100">
          <div class="flex items-center gap-2 text-xs text-slate-400">
            <div class="flex-1 h-1.5 bg-slate-100 overflow-hidden">
              <div class="h-full w-3/4 bg-blue-500"></div>
            </div>
            <span>Click to edit</span>
          </div>
        </div>
      </div>

      <!-- Quick Actions (hover) -->
      <div class="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
        <button
          type="button"
          data-action="rename-project"
          data-project-id="${escapeHtml(project.id)}"
          class="p-1.5 border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          title="Rename CV"
          aria-label="Rename CV"
        >
          <i data-lucide="pencil" class="h-4 w-4"></i>
        </button>
        <button
          type="button"
          data-action="export-project"
          data-project-id="${escapeHtml(project.id)}"
          class="p-1.5 border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          title="Export PDF"
          aria-label="Export PDF"
        >
          <i data-lucide="file-down" class="h-4 w-4"></i>
        </button>
        <button
          type="button"
          data-action="delete-project"
          data-project-id="${escapeHtml(project.id)}"
          class="p-1.5 border border-slate-200 bg-white text-slate-600 hover:bg-rose-50 hover:text-rose-700 transition-colors"
          title="Delete CV"
          aria-label="Delete CV"
        >
          <i data-lucide="trash-2" class="h-4 w-4"></i>
        </button>
      </div>
    </div>
  `;
}

function renderEmptyState(): string {
  return `
    <div class="flex flex-col items-center justify-center py-20 text-center">
      <div class="flex h-20 w-20 items-center justify-center border border-slate-200 bg-white text-blue-600">
        <i data-lucide="folder-open" class="h-10 w-10"></i>
      </div>
      <h3 class="mt-6 text-xl font-semibold text-slate-900">No projects yet</h3>
      <p class="mt-2 text-sm text-slate-500 max-w-sm">
        Start by creating your first CV. You can always come back and edit it later.
      </p>
      <button
        class="mt-6 inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors btn-active"
        type="button"
        data-action="new-cv-empty"
      >
        <i data-lucide="plus" class="h-4 w-4"></i>
        Create Your First CV
      </button>
    </div>
  `;
}

function renderCreateNewCard(): string {
  return `
    <button
      type="button"
      data-action="new-cv"
      class="group relative w-full min-h-45 flex flex-col items-center justify-center gap-3 border-2 border-dashed border-slate-300 bg-white p-5 hover:border-slate-400 hover:bg-slate-50 transition-colors duration-150"
    >
      <div class="flex h-12 w-12 items-center justify-center border border-slate-200 bg-white text-slate-500 group-hover:text-blue-700 transition-colors">
        <i data-lucide="plus" class="h-6 w-6"></i>
      </div>
      <div class="text-center">
        <div class="text-sm font-semibold text-slate-800">Create New CV</div>
        <div class="text-xs text-slate-500 mt-0.5">Start from scratch</div>
      </div>
    </button>
  `;
}

function renderRecentProjects(projects: Project[]): string {
  if (projects.length === 0) {
    return renderEmptyState();
  }

  const projectCards = projects.map(renderProjectCard).join("");

  return `
    <section>
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-slate-900">Recent Projects</h2>
        <span class="text-sm text-slate-500">${projects.length} project${projects.length !== 1 ? 's' : ''}</span>
      </div>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" data-role="projects-grid">
        ${renderCreateNewCard()}
        ${projectCards}
      </div>
    </section>
  `;
}

export function renderDashboardScreen(
  root: HTMLElement,
  projects: Project[] = [],
  handlers: DashboardScreenHandlers = {}
) {
  root.innerHTML = `
    <div class="flex min-h-screen bg-slate-50">
      <!-- Sidebar -->
      <aside class="w-64 shrink-0 bg-white border-r border-slate-200">
        <div class="flex h-full flex-col">
          <!-- Logo -->
          <div class="flex items-center gap-3 px-5 py-5 border-b border-slate-100">
            <div class="flex h-9 w-9 items-center justify-center bg-blue-600 text-white">
              <i data-lucide="file-text" class="h-5 w-5"></i>
            </div>
            <span class="text-lg font-bold text-slate-900">VITA</span>
          </div>

          <!-- Navigation -->
          <nav class="flex-1 px-3 py-4 space-y-1">
            <a
              href="#"
              class="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-100"
            >
              <i data-lucide="layout-dashboard" class="h-4 w-4"></i>
              Dashboard
            </a>
            <a
              href="#"
              class="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              <i data-lucide="file-text" class="h-4 w-4"></i>
              Templates
            </a>
          </nav>

          <!-- Bottom Section -->
          <div class="p-4 border-t border-slate-100">
            <div class="flex items-center gap-3 px-3 py-2 bg-slate-50 border border-slate-100">
              <div class="flex h-8 w-8 items-center justify-center bg-emerald-100 text-emerald-700">
                <i data-lucide="folder-open" class="h-4 w-4"></i>
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-xs font-medium text-slate-900">Local Storage</div>
                <div class="text-xs text-slate-500">Your data is private</div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 flex flex-col min-w-0">
        <!-- Top Header -->
        <header class="bg-white border-b border-slate-200 px-8 py-4">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-2xl font-bold text-slate-900">Dashboard</h1>
              <p class="mt-0.5 text-sm text-slate-500">Manage your CV projects</p>
            </div>
            <button
              class="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors btn-active"
              type="button"
              data-action="new-cv"
            >
              <i data-lucide="plus" class="h-4 w-4"></i>
              New CV
            </button>
          </div>
        </header>

        <!-- Content Area -->
        <div class="flex-1 overflow-auto p-8">
          ${renderRecentProjects(projects)}
        </div>
      </main>
    </div>
  `;

  createIcons({
    icons: {
      FolderOpen,
      LayoutDashboard,
      FileText,
      FileDown,
      Plus,
      Search,
      MoreVertical,
      Clock,
      FilePlus,
      Trash2,
      Pencil,
    },
    nameAttr: "data-lucide",
    root,
  });

  const newCvButtons = root.querySelectorAll<HTMLButtonElement>('[data-action="new-cv"], [data-action="new-cv-empty"]');
  newCvButtons.forEach(button => {
    button.addEventListener("click", () => {
      handlers.onCreateCv?.();
    });
  });

  const projectsGrid = root.querySelector<HTMLDivElement>(
    '[data-role="projects-grid"]'
  );

  // Inline rename helpers
  const startRename = (projectId: string) => {
    const titleEl = projectsGrid?.querySelector<HTMLHeadingElement>(
      `[data-role="project-title"][data-project-id="${projectId}"]`
    );
    const inputEl = projectsGrid?.querySelector<HTMLTextAreaElement>(
      `[data-role="title-input"][data-project-id="${projectId}"]`
    );
    if (!titleEl || !inputEl) return;

    titleEl.classList.add("hidden");
    inputEl.classList.remove("hidden");
    inputEl.value = titleEl.textContent?.trim() || "";
    // Autosize to fit wrapped text.
    inputEl.style.height = "auto";
    inputEl.style.height = `${inputEl.scrollHeight}px`;
    inputEl.focus();
    // Prefer partial edits: place caret at end instead of selecting everything.
    const len = inputEl.value.length;
    try {
      inputEl.setSelectionRange(len, len);
    } catch {
      // ignore
    }
  };

  const endRename = async (projectId: string, save: boolean) => {
    const titleEl = projectsGrid?.querySelector<HTMLHeadingElement>(
      `[data-role="project-title"][data-project-id="${projectId}"]`
    );
    const inputEl = projectsGrid?.querySelector<HTMLTextAreaElement>(
      `[data-role="title-input"][data-project-id="${projectId}"]`
    );
    if (!titleEl || !inputEl) return;

    const newTitle = inputEl.value.replace(/[\r\n]+/g, " ").trim();
    const oldTitle = titleEl.textContent?.trim() || "";

    inputEl.classList.add("hidden");
    titleEl.classList.remove("hidden");

    if (save && newTitle && newTitle !== oldTitle && handlers.onRenameProject) {
      titleEl.textContent = newTitle;
      try {
        await handlers.onRenameProject(projectId, newTitle);
      } catch (err) {
        // Revert on error
        titleEl.textContent = oldTitle;
        console.error("Failed to rename project:", err);
      }
    }
  };

  // Bind inline rename events
  projectsGrid?.addEventListener("click", (event) => {
    const target = event.target as HTMLElement | null;

    // Handle rename button click
    const renameButton = target?.closest<HTMLButtonElement>(
      '[data-action="rename-project"]'
    );
    if (renameButton) {
      event.preventDefault();
      event.stopPropagation();
      const projectId = renameButton.getAttribute("data-project-id");
      if (projectId) {
        startRename(projectId);
      }
      return;
    }

    // Handle title click to start rename
    const titleEl = target?.closest<HTMLHeadingElement>(
      '[data-role="project-title"]'
    );
    if (titleEl) {
      event.preventDefault();
      event.stopPropagation();
      const projectId = titleEl.getAttribute("data-project-id");
      if (projectId) {
        startRename(projectId);
      }
      return;
    }

    // Handle input click (don't propagate)
    const inputEl = target?.closest<HTMLTextAreaElement>(
      '[data-role="title-input"]'
    );
    if (inputEl) {
      // Allow the input to receive focus and caret placement.
      event.stopPropagation();
      return;
    }

    const exportButton = target?.closest<HTMLButtonElement>(
      '[data-action="export-project"]'
    );
    if (exportButton) {
      event.preventDefault();
      event.stopPropagation();
      const projectId = exportButton.getAttribute("data-project-id");
      if (projectId) {
        handlers.onQuickExport?.(projectId);
      }
      return;
    }

    const deleteButton = target?.closest<HTMLButtonElement>(
      '[data-action="delete-project"]'
    );
    if (deleteButton) {
      event.preventDefault();
      event.stopPropagation();
      const projectId = deleteButton.getAttribute("data-project-id");
      if (projectId) {
        handlers.onDeleteProject?.(projectId);
      }
      return;
    }

    const openEl = target?.closest<HTMLElement>('[data-action="open-project"]');
    // While editing the title (textarea visible), ignore open.
    if (openEl) {
      const activeEditor = openEl.querySelector<HTMLTextAreaElement>(
        '[data-role="title-input"]:not(.hidden)'
      );
      if (activeEditor) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
    }

    const projectId = openEl?.getAttribute("data-project-id");
    if (projectId) {
      handlers.onOpenProject?.(projectId);
    }
  });

  // Handle keyboard events for inline rename inputs
  projectsGrid?.addEventListener("keydown", (event) => {
    const target = event.target as HTMLElement | null;
    const inputEl = target?.closest<HTMLTextAreaElement>('[data-role="title-input"]');
    if (!inputEl) return;

    // Prevent key events from bubbling to the surrounding <button> (nested interactive
    // elements), which can cause Space to activate the button and open the project.
    event.stopPropagation();

    const projectId = inputEl.getAttribute("data-project-id");
    if (!projectId) return;

    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      endRename(projectId, true);
    } else if (event.key === "Escape") {
      event.preventDefault();
      endRename(projectId, false);
    }
  });

  // Keyboard support for opening a card when focused.
  projectsGrid?.addEventListener("keydown", (event) => {
    const target = event.target as HTMLElement | null;
    const cardEl = target?.closest<HTMLElement>('[data-action="open-project"]');
    if (!cardEl) return;
    if (target !== cardEl) return;

    // Don't open while editing title.
    const activeEditor = cardEl.querySelector<HTMLTextAreaElement>(
      '[data-role="title-input"]:not(.hidden)'
    );
    if (activeEditor) return;

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const projectId = cardEl.getAttribute("data-project-id");
      if (projectId) {
        handlers.onOpenProject?.(projectId);
      }
    }
  });

  projectsGrid?.addEventListener("keyup", (event) => {
    const target = event.target as HTMLElement | null;
    const inputEl = target?.closest<HTMLTextAreaElement>('[data-role="title-input"]');
    if (!inputEl) return;
    // Stop Space/Enter bubbling which can trigger button "click" activation.
    event.stopPropagation();
  });

  // Autosize textarea as the user types.
  projectsGrid?.addEventListener("input", (event) => {
    const target = event.target as HTMLElement | null;
    const inputEl = target?.closest<HTMLTextAreaElement>('[data-role="title-input"]');
    if (!inputEl) return;
    inputEl.style.height = "auto";
    inputEl.style.height = `${inputEl.scrollHeight}px`;
  });

  // Handle blur for inline rename inputs
  projectsGrid?.addEventListener("focusout", (event) => {
    const target = event.target as HTMLElement | null;
    const inputEl = target?.closest<HTMLTextAreaElement>('[data-role="title-input"]');
    if (!inputEl) return;

    const projectId = inputEl.getAttribute("data-project-id");
    if (!projectId) return;

    // Small delay to check if focus moved to another element (like a button)
    setTimeout(() => {
      if (!inputEl.classList.contains("hidden")) {
        endRename(projectId, true);
      }
    }, 100);
  });
}
