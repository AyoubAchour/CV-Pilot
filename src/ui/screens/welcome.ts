import { ArrowRight, FilePlus, Lock, createIcons } from "lucide";

export interface WelcomeScreenHandlers {
  onCreateCv?: () => void;
  onGoToDashboard?: () => void;
}

export function renderWelcomeScreen(
  root: HTMLElement,
  handlers: WelcomeScreenHandlers = {}
) {
  root.innerHTML = `
    <main class="min-h-screen flex items-center justify-center p-8">
      <section class="w-full max-w-md  border border-slate-200 bg-white p-8 shadow-sm">
        <div class="flex flex-col items-center text-center">
          <div class="flex h-14 w-14 items-center justify-center  bg-blue-600 text-white text-lg font-semibold">
            CV
          </div>
          <h1 class="mt-5 text-2xl font-semibold text-slate-900">CV Pilot</h1>
          <p class="mt-1 text-sm text-slate-500">Your CV, Your Control</p>
        </div>

        <div class="mt-6 space-y-3">
          <button
            class="w-full inline-flex items-center justify-center gap-2 border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            type="button"
            data-action="new-cv"
          >
            <i data-lucide="file-plus" class="h-4 w-4 text-slate-500"></i>
            Create a CV
          </button>
        </div>

        <div class="mt-4 flex items-center justify-center">
          <button
            class="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
            type="button"
            data-action="go-dashboard"
          >
            Go To Dashboard
          </button>
        </div>

        <div class="mt-6  border border-slate-200 bg-slate-50 p-4">
          <div class="flex items-start gap-3">
            <div class="mt-0.5 text-slate-500">
              <i data-lucide="lock" class="h-4 w-4"></i>
            </div>
            <div>
              <p class="text-sm font-semibold text-slate-900">Local-first by default</p>
              <p class="mt-1 text-xs text-slate-600">
                Your data stays on your device. You control all integrations.
              </p>
              <button
                class="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                type="button"
              >
                View data settings
                <i data-lucide="arrow-right" class="h-3.5 w-3.5"></i>
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  `;

  createIcons({
    icons: {
      FilePlus,
      Lock,
      ArrowRight,
    },
    nameAttr: "data-lucide",
    root,
  });

  const goDashboardButton = root.querySelector<HTMLButtonElement>(
    '[data-action="go-dashboard"]'
  );
  goDashboardButton?.addEventListener("click", () => {
    handlers.onGoToDashboard?.();
  });

  const newCvButton = root.querySelector<HTMLButtonElement>('[data-action="new-cv"]');
  newCvButton?.addEventListener("click", () => {
    handlers.onCreateCv?.();
  });
}
