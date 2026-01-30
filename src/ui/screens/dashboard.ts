import {
  FolderOpen,
  LayoutDashboard,
  FileText,
  Plus,
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

function renderProjectCard(project: Project): string {
  const tagsHtml = project.tags
    .map(
      (tag) =>
        `<span class="inline-block border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700">${escapeHtml(
          tag
        )}</span>`
    )
    .join("");

  return `
    <button
      type="button"
      data-action="open-project"
      data-project-id="${escapeHtml(project.id)}"
      class="w-full text-left border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
    >
      <h3 class="text-sm font-semibold text-slate-900">${escapeHtml(project.title)}</h3>
      <p class="mt-1 text-xs text-slate-500">Last edited: ${escapeHtml(
        project.lastEdited
      )}</p>
      <div class="mt-3 flex flex-wrap gap-2">
        ${tagsHtml}
      </div>
    </button>
  `;
}

function renderEmptyState(): string {
  return `
    <div class="flex flex-col items-center justify-center py-16 text-center">
      <div class="text-slate-400">
        <i data-lucide="folder-open" class="h-12 w-12"></i>
      </div>
      <h3 class="mt-4 text-base font-semibold text-slate-900">No projects yet</h3>
      <p class="mt-1 text-sm text-slate-500">Create a CV to get started</p>
    </div>
  `;
}

function renderRecentProjects(projects: Project[]): string {
  if (projects.length === 0) {
    return renderEmptyState();
  }

  const projectCards = projects.map(renderProjectCard).join("");

  return `
    <section>
      <h2 class="text-base font-semibold text-slate-900">Recent Projects</h2>
      <div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" data-role="projects-grid">
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
    <div class="flex min-h-screen">
      <!-- Sidebar -->
      <aside class="w-56 shrink-0 bg-slate-800">
        <div class="flex h-full flex-col">
          <!-- Logo -->
          <div class="flex items-center gap-2 px-4 py-4">
            <div class="flex h-8 w-8 items-center justify-center bg-blue-600 text-xs font-bold text-white">
              CV
            </div>
            <span class="text-sm font-semibold text-white">CV Pilot</span>
          </div>

          <!-- Navigation -->
          <nav class="mt-2 flex-1 px-2">
            <a
              href="#"
              class="flex items-center gap-2 rounded px-3 py-2 text-sm font-medium text-white bg-slate-700"
            >
              <i data-lucide="layout-dashboard" class="h-4 w-4"></i>
              Dashboard
            </a>
            <a
              href="#"
              class="mt-1 flex items-center gap-2 rounded px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              <i data-lucide="file-text" class="h-4 w-4"></i>
              Templates
            </a>
          </nav>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 bg-slate-100">
        <div class="p-8">
          <!-- Header -->
          <div class="flex items-center gap-3">
            <h1 class="text-2xl font-bold text-slate-900">Dashboard</h1>
            <button
              class="inline-flex items-center justify-center gap-2 border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 shadow-sm hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              type="button"
              data-action="new-cv"
            >
              <i data-lucide="plus" class="h-4 w-4"></i>
              New CV
            </button>
          </div>

          <!-- Recent Projects -->
          <div class="mt-6">
            ${renderRecentProjects(projects)}
          </div>
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
    },
    nameAttr: "data-lucide",
    root,
  });

  const newCvButton = root.querySelector<HTMLButtonElement>('[data-action="new-cv"]');
  newCvButton?.addEventListener("click", () => {
    handlers.onCreateCv?.();
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
