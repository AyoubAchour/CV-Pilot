import { renderDashboardScreen } from "./screens/dashboard";
import { renderEditorScreen } from "./screens/editor";
import { renderWelcomeScreen } from "./screens/welcome";
import type { Project } from "./screens/dashboard";
import type { CvDocument } from "../shared/cv-model";

type Screen = "welcome" | "dashboard" | "editor";

export function renderApp() {
  const root = document.getElementById("app");

  if (!root) {
    throw new Error("App root element (#app) not found.");
  }

  let currentScreen: Screen = "welcome";

  let projects: Project[] = [];
  let isCreatingCv = false;

  let editorProject: Project | null = null;
  let editorCv: CvDocument | null = null;
  let editorError: string | null = null;

  const refreshProjects = async () => {
    projects = (await window.cvPilot.listProjects()).filter((p) => p.tags.includes("cv"));
  };

  const goToDashboard = async () => {
    currentScreen = "dashboard";
    editorProject = null;
    editorCv = null;
    editorError = null;
    await refreshProjects();
    render();
  };

  const goToEditor = async (projectId: string) => {
    currentScreen = "editor";
    editorProject = projects.find((p) => p.id === projectId) ?? null;
    editorCv = null;
    editorError = null;
    render();

    try {
      editorCv = await window.cvPilot.getProjectCv(projectId);
    } catch (err) {
      console.error(err);
      editorError = err instanceof Error ? err.message : "Failed to load CV";
    }

    render();
  };

  const openProject = async (projectId: string) => {
    const project = projects.find((p) => p.id === projectId) ?? null;
    if (!project) {
      await goToDashboard();
      return;
    }

    await goToEditor(projectId);
  };

  const onCreateCv = async () => {
    if (isCreatingCv) {
      return;
    }
    isCreatingCv = true;
    try {
      const result = await window.cvPilot.createBlankCvProject();
      await refreshProjects();
      await goToEditor(result.project.id);
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Unknown error";
      window.alert(`Create CV failed: ${message}`);
    } finally {
      isCreatingCv = false;
    }
  };

  const render = () => {
    switch (currentScreen) {
      case "welcome":
        renderWelcomeScreen(root, {
          onCreateCv: () => {
            void onCreateCv();
          },
          onGoToDashboard: () => {
            void goToDashboard();
          },
        });
        return;

      case "dashboard":
        renderDashboardScreen(root, projects, {
          onCreateCv: () => {
            void onCreateCv();
          },
          onOpenProject: (projectId) => {
            void openProject(projectId);
          },
          onQuickExport: (projectId) => {
            void (async () => {
              try {
                const cv = await window.cvPilot.getProjectCv(projectId);
                const result = await window.cvPilot.exportCvPdf({ projectId, cv });
                if (!result.canceled && "savedPath" in result) {
                  window.alert(`Exported PDF to: ${result.savedPath}`);
                }
              } catch (err) {
                const message = err instanceof Error ? err.message : "Export failed.";
                window.alert(`Export failed: ${message}`);
              }
            })();
          },
          onDeleteProject: (projectId) => {
            void (async () => {
              const project = projects.find((p) => p.id === projectId);
              const label = project ? project.title : projectId;
              const ok = window.confirm(
                `Delete this CV?\n\n${label}\n\nThis cannot be undone.`
              );
              if (!ok) return;
              try {
                await window.cvPilot.deleteProject(projectId);
                await refreshProjects();
                render();
              } catch (err) {
                const message = err instanceof Error ? err.message : "Delete failed.";
                window.alert(`Delete failed: ${message}`);
              }
            })();
          },
          onRenameProject: async (projectId, newTitle) => {
            try {
              const result = await window.cvPilot.renameProject({
                projectId,
                customTitle: newTitle,
              });
              // Update local state
              const project = projects.find((p) => p.id === projectId);
              if (project) {
                project.title = result.title;
                project.customTitle = newTitle;
              }
            } catch (err) {
              const message = err instanceof Error ? err.message : "Rename failed.";
              window.alert(`Rename failed: ${message}`);
              throw err; // Re-throw to trigger revert in UI
            }
          },
        });
        return;

      case "editor":
        if (!editorProject) {
          root.innerHTML = `
            <main class="min-h-screen flex items-center justify-center p-8">
              <div class="w-full max-w-md border border-slate-200 bg-white p-6 shadow-sm">
                <h1 class="text-base font-semibold text-slate-900">Project not found</h1>
                <p class="mt-1 text-sm text-slate-600">The selected project could not be loaded.</p>
                <button
                  class="mt-4 inline-flex items-center justify-center bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
                  type="button"
                  data-action="back"
                >
                  Back to Dashboard
                </button>
              </div>
            </main>
          `;
          root.querySelector<HTMLButtonElement>("[data-action=back]")?.addEventListener(
            "click",
            () => {
              void goToDashboard();
            }
          );
          return;
        }

        if (editorError) {
          root.innerHTML = `
            <main class="min-h-screen flex items-center justify-center p-8">
              <div class="w-full max-w-md border border-slate-200 bg-white p-6 shadow-sm">
                <h1 class="text-base font-semibold text-slate-900">Failed to open CV</h1>
                <p class="mt-2 text-sm text-slate-600">${editorError}</p>
                <button
                  class="mt-4 inline-flex items-center justify-center bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
                  type="button"
                  data-action="back"
                >
                  Back to Dashboard
                </button>
              </div>
            </main>
          `;
          root.querySelector<HTMLButtonElement>("[data-action=back]")?.addEventListener(
            "click",
            () => {
              void goToDashboard();
            }
          );
          return;
        }

        if (!editorCv) {
          root.innerHTML = `
            <main class="min-h-screen flex items-center justify-center p-8">
              <div class="w-full max-w-md border border-slate-200 bg-white p-6 shadow-sm">
                <h1 class="text-base font-semibold text-slate-900">Loading editor…</h1>
                <p class="mt-1 text-sm text-slate-600">Preparing ${editorProject.title}</p>
                <button
                  class="mt-4 inline-flex items-center justify-center border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-sm hover:bg-slate-50"
                  type="button"
                  data-action="back"
                >
                  Back to Dashboard
                </button>
              </div>
            </main>
          `;
          root.querySelector<HTMLButtonElement>("[data-action=back]")?.addEventListener(
            "click",
            () => {
              void goToDashboard();
            }
          );
          return;
        }

        renderEditorScreen(
          root,
          {
            project: editorProject,
            cv: editorCv,
          },
          {
            onBack: () => {
              void goToDashboard();
            },
            onSave: async (cv) => {
              await window.cvPilot.saveProjectCv({
                projectId: editorProject.id,
                cv,
              });
            },
            onExportPdf: async (cv, suggestedFileName) => {
              const result = await window.cvPilot.exportCvPdf({
                projectId: editorProject.id,
                cv,
                suggestedFileName,
              });

              if (!result.canceled && "savedPath" in result) {
                window.alert(`Exported PDF to: ${result.savedPath}`);
              }
            },
            onRenameProject: async (newTitle) => {
              if (!editorProject) return;
              try {
                const result = await window.cvPilot.renameProject({
                  projectId: editorProject.id,
                  customTitle: newTitle,
                });
                // Update local state so navigation back shows updated title
                editorProject.title = result.title;
                editorProject.customTitle = newTitle;
              } catch (err) {
                const message = err instanceof Error ? err.message : "Rename failed.";
                window.alert(`Rename failed: ${message}`);
                throw err; // Re-throw to trigger revert in UI
              }
            },          }
        );
        return;
    }
  };

  void refreshProjects().finally(() => {
    render();
  });
}
