import { renderDashboardScreen } from "./screens/dashboard";
import { renderEditorScreen } from "./screens/editor";
import { renderWelcomeScreen } from "./screens/welcome";
import { renderViewerScreen } from "./screens/viewer";
import type { Project } from "./screens/dashboard";
import { extractCvTextFromPdf } from "./lib/extractCvTextFromPdf";
import { createBlankCv, type CvDocument } from "../shared/cv-model";

type Screen = "welcome" | "dashboard" | "viewer" | "editor";

export function renderApp() {
  const root = document.getElementById("app");

  if (!root) {
    throw new Error("App root element (#app) not found.");
  }

  let currentScreen: Screen = "welcome";

  let projects: Project[] = [];
  let isImporting = false;
  let isCreatingCv = false;

  let viewerProject: Project | null = null;
  let viewerPdfBytes: Uint8Array | null = null;
  let viewerError: string | null = null;

  let editorProject: Project | null = null;
  let editorCv: CvDocument | null = null;
  let editorError: string | null = null;
  let editorSourceText: string | null = null;

  const refreshProjects = async () => {
    projects = await window.cvPilot.listProjects();
  };

  const goToDashboard = async () => {
    currentScreen = "dashboard";
    viewerProject = null;
    viewerPdfBytes = null;
    viewerError = null;
    editorProject = null;
    editorCv = null;
    editorError = null;
    editorSourceText = null;
    await refreshProjects();
    render();
  };

  const goToViewer = async (projectId: string) => {
    currentScreen = "viewer";
    viewerProject = projects.find((p) => p.id === projectId) ?? null;
    viewerPdfBytes = null;
    viewerError = null;
    editorProject = null;
    editorCv = null;
    editorError = null;
    editorSourceText = null;
    render();

    try {
      viewerPdfBytes = await window.cvPilot.getProjectPdf(projectId);
    } catch (err) {
      console.error(err);
      viewerError = err instanceof Error ? err.message : "Failed to load PDF";
    }

    render();
  };

  const goToEditor = async (projectId: string) => {
    currentScreen = "editor";
    editorProject = projects.find((p) => p.id === projectId) ?? null;
    editorCv = null;
    editorError = null;
    editorSourceText = null;
    viewerProject = null;
    viewerPdfBytes = null;
    viewerError = null;
    render();

    try {
      editorCv = await window.cvPilot.getProjectCv(projectId);
    } catch (err) {
      console.error(err);
      editorError = err instanceof Error ? err.message : "Failed to load CV";
    }

    render();
  };

  const goToEditorFromImportedPdf = async (projectId: string) => {
    currentScreen = "editor";
    editorProject = projects.find((p) => p.id === projectId) ?? viewerProject;
    editorCv = null;
    editorError = null;
    editorSourceText = null;
    viewerProject = null;
    viewerPdfBytes = null;
    viewerError = null;
    render();

    try {
      editorSourceText = await window.cvPilot.getProjectExtractText(projectId);
    } catch (err) {
      console.error(err);
      editorSourceText = "";
    }

    try {
      editorCv = await window.cvPilot.getProjectCv(projectId);
    } catch {
      // No structured CV yet for this PDF project—start from a blank and persist it.
      const blank = createBlankCv();
      await window.cvPilot.saveProjectCv({ projectId, cv: blank });
      editorCv = blank;
      await refreshProjects();
    }

    render();
  };

  const openProject = async (projectId: string) => {
    const project = projects.find((p) => p.id === projectId) ?? null;
    if (!project) {
      await goToDashboard();
      return;
    }

    if (project.tags.includes("cv")) {
      await goToEditor(projectId);
      return;
    }

    await goToViewer(projectId);
  };

  const onImportCv = async () => {
    if (isImporting) {
      return;
    }
    isImporting = true;

    try {
      const result = await window.cvPilot.importCvPdf();
      if (result.canceled || !result.projectId || !result.fileName || !result.pdfBytes) {
        return;
      }

      const extracted = await extractCvTextFromPdf(result.pdfBytes);
      await window.cvPilot.saveProjectExtract({
        projectId: result.projectId,
        text: extracted.text,
        usedOcr: extracted.usedOcr,
        pageCount: extracted.pageCount,
      });

      await goToDashboard();
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Unknown error";
      window.alert(`Import failed: ${message}`);
    } finally {
      isImporting = false;
    }
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
          onImportCv,
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
          onImportCv,
          onCreateCv: () => {
            void onCreateCv();
          },
          onOpenProject: (projectId) => {
            void openProject(projectId);
          },
        });
        return;
      case "viewer":
        if (!viewerProject) {
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

        if (viewerError) {
          root.innerHTML = `
            <main class="min-h-screen flex items-center justify-center p-8">
              <div class="w-full max-w-md border border-slate-200 bg-white p-6 shadow-sm">
                <h1 class="text-base font-semibold text-slate-900">Failed to open PDF</h1>
                <p class="mt-2 text-sm text-slate-600">${viewerError}</p>
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

        if (!viewerPdfBytes) {
          root.innerHTML = `
            <main class="min-h-screen flex items-center justify-center p-8">
              <div class="w-full max-w-md border border-slate-200 bg-white p-6 shadow-sm">
                <h1 class="text-base font-semibold text-slate-900">Loading PDF…</h1>
                <p class="mt-1 text-sm text-slate-600">Preparing preview for ${viewerProject.title}</p>
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

        renderViewerScreen(
          root,
          {
            project: viewerProject,
            pdfBytes: viewerPdfBytes,
          },
          {
            onBack: () => {
              void goToDashboard();
            },
            onEditAsCv: () => {
              void goToEditorFromImportedPdf(viewerProject.id);
            },
          }
        );
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
            sourceText: editorSourceText ?? undefined,
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
          }
        );
        return;
    }
  };

  void refreshProjects().finally(() => {
    render();
  });
}
