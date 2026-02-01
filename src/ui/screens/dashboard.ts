import {
  FolderOpen,
  LayoutDashboard,
  FileText,
  Plus,
  Search,
  MoreVertical,
  Clock,
  FilePlus,
  createIcons,
} from "lucide";

export interface DashboardScreenHandlers {
  onCreateCv?: () => void;
  onOpenProject?: (projectId: string) => void;
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
    <button
      type="button"
      data-action="open-project"
      data-project-id="${escapeHtml(project.id)}"
      class="group relative w-full text-left bg-white border border-slate-200 p-5 transition-colors duration-150 hover:border-slate-300 hover:bg-slate-50"
    >
      <!-- Card Header -->
      <div class="flex items-start justify-between gap-3">
        <div class="flex-1 min-w-0">
          <h3 class="text-base font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
            ${escapeHtml(project.title)}
          </h3>
          <div class="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
            <i data-lucide="clock" class="h-3 w-3"></i>
            <span>${escapeHtml(formatRelativeTime(project.lastEdited))}</span>
          </div>
        </div>
        <div class="opacity-0 group-hover:opacity-100 transition-opacity">
          <div class="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600">
            <i data-lucide="more-vertical" class="h-4 w-4"></i>
          </div>
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
    </button>
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
            <span class="text-lg font-bold text-slate-900">CV Pilot</span>
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
      Plus,
      Search,
      MoreVertical,
      Clock,
      FilePlus,
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
  projectsGrid?.addEventListener("click", (event) => {
    const target = event.target as HTMLElement | null;
    const openButton = target?.closest<HTMLButtonElement>(
      '[data-action="open-project"]'
    );
    const projectId = openButton?.getAttribute("data-project-id");
    if (projectId) {
      handlers.onOpenProject?.(projectId);
    }
  });
}
