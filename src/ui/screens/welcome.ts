import {
  ArrowRight,
  FilePlus,
  Shield,
  Sparkles,
  FileText,
  createIcons,
} from "lucide";

export interface WelcomeScreenHandlers {
  onCreateCv?: () => void;
  onGoToDashboard?: () => void;
}

export function renderWelcomeScreen(
  root: HTMLElement,
  handlers: WelcomeScreenHandlers = {}
) {
  root.innerHTML = `
    <a href="#main-content" class="skip-link">Skip to main content</a>
    
    <main id="main-content" class="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div class="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        
        <!-- Left Column: Hero Content -->
        <section class="text-center lg:text-left">
          <!-- Logo -->
          <div class="inline-flex items-center gap-3 mb-6">
            <div class="flex h-12 w-12 items-center justify-center bg-blue-600 text-white">
              <i data-lucide="file-text" class="h-6 w-6"></i>
            </div>
            <span class="text-xl font-bold text-slate-900">CV Pilot</span>
          </div>

          <!-- Headline -->
          <h1 class="text-4xl lg:text-5xl font-bold text-slate-900 leading-tight">
            Build professional CVs in minutes
          </h1>
          
          <!-- Subheadline -->
          <p class="mt-4 text-lg text-slate-600 max-w-md mx-auto lg:mx-0">
            Create, edit, and export ATS-friendly resumes with AI-powered suggestions and GitHub integration.
          </p>

          <!-- Feature List -->
          <div class="mt-8 space-y-3">
            <div class="flex items-center gap-3 justify-center lg:justify-start text-slate-700">
              <div class="flex h-5 w-5 items-center justify-center bg-slate-100 text-slate-700">
                <i data-lucide="shield" class="h-3 w-3"></i>
              </div>
              <span class="text-sm">Local-first & private — your data stays on your device</span>
            </div>
            <div class="flex items-center gap-3 justify-center lg:justify-start text-slate-700">
              <div class="flex h-5 w-5 items-center justify-center bg-slate-100 text-slate-700">
                <i data-lucide="file-text" class="h-3 w-3"></i>
              </div>
              <span class="text-sm">Export to PDF — professional A4 formatting</span>
            </div>
            <div class="flex items-center gap-3 justify-center lg:justify-start text-slate-700">
              <div class="flex h-5 w-5 items-center justify-center bg-slate-100 text-slate-700">
                <i data-lucide="sparkles" class="h-3 w-3"></i>
              </div>
              <span class="text-sm">AI-powered suggestions — improve your CV with OpenAI</span>
            </div>
          </div>

          <!-- CTA Buttons -->
          <div class="mt-10 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
            <button
              class="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors btn-active"
              type="button"
              data-action="new-cv"
            >
              <i data-lucide="file-plus" class="h-4 w-4"></i>
              Create Your CV
            </button>
            <button
              class="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-slate-700 text-sm font-semibold border border-slate-200 hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors btn-active"
              type="button"
              data-action="go-dashboard"
            >
              Open Existing
              <i data-lucide="arrow-right" class="h-4 w-4"></i>
            </button>
          </div>
        </section>

        <!-- Right Column: Professional Overview -->
        <section class="hidden lg:block">
          <div class="bg-white border border-slate-200 p-6">
            <div class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Quick start</div>

            <ol class="mt-4 space-y-4">
              <li class="flex gap-3">
                <div class="flex h-6 w-6 items-center justify-center border border-slate-200 text-slate-700 text-xs font-semibold">1</div>
                <div>
                  <div class="text-sm font-semibold text-slate-900">Create</div>
                  <div class="text-xs text-slate-600">Start a new CV in seconds.</div>
                </div>
              </li>
              <li class="flex gap-3">
                <div class="flex h-6 w-6 items-center justify-center border border-slate-200 text-slate-700 text-xs font-semibold">2</div>
                <div>
                  <div class="text-sm font-semibold text-slate-900">Edit</div>
                  <div class="text-xs text-slate-600">Work section-by-section with a live preview.</div>
                </div>
              </li>
              <li class="flex gap-3">
                <div class="flex h-6 w-6 items-center justify-center border border-slate-200 text-slate-700 text-xs font-semibold">3</div>
                <div>
                  <div class="text-sm font-semibold text-slate-900">Export</div>
                  <div class="text-xs text-slate-600">Generate a clean A4 PDF when you’re ready.</div>
                </div>
              </li>
            </ol>

            <div class="mt-6 border-t border-slate-100 pt-4 text-xs text-slate-500">
              Local-first by default. AI is optional.
            </div>
          </div>
        </section>

        <!-- Mobile: Trust Badge -->
        <section class="lg:hidden mt-8">
          <div class="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200">
            <svg class="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span class="text-sm text-slate-600">Local-first & private</span>
          </div>
        </section>
      </div>
    </main>
  `;

  createIcons({
    icons: {
      FilePlus,
      ArrowRight,
      Shield,
      Sparkles,
      FileText,
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
