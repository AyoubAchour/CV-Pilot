import type { CvDocument } from "../../../shared/cv-model";

export function renderEditorHtml(model: { project: ProjectSummary }, currentCv: CvDocument): string {
  return `
    <div class="flex h-screen overflow-hidden bg-slate-50">
      <!-- Left Sidebar -->
      <aside class="w-64 shrink-0 bg-white border-r border-slate-200 flex flex-col h-full">
        <!-- Logo -->
        <div class="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <div class="flex h-9 w-9 items-center justify-center bg-blue-600 text-white">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span class="text-lg font-bold text-slate-900">CV Pilot</span>
        </div>

        <!-- Navigation -->
        <nav class="flex-1 min-h-0 px-3 py-4 space-y-1 overflow-y-auto overscroll-contain">
          <button
            type="button"
            data-action="back"
            class="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </button>

          <div class="pt-4 pb-2">
            <div class="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Sections</div>
          </div>

          <a href="#section-basics" class="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors">
            <span class="flex h-5 w-5 items-center justify-center bg-blue-100 text-blue-700 text-xs font-bold">1</span>
            Basics
          </a>
          <a href="#section-experience" class="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors">
            <span class="flex h-5 w-5 items-center justify-center bg-blue-100 text-blue-700 text-xs font-bold">2</span>
            Experience
          </a>
          <a href="#section-education" class="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors">
            <span class="flex h-5 w-5 items-center justify-center bg-blue-100 text-blue-700 text-xs font-bold">3</span>
            Education
          </a>
          <a href="#section-skills" class="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors">
            <span class="flex h-5 w-5 items-center justify-center bg-blue-100 text-blue-700 text-xs font-bold">4</span>
            Skills
          </a>
          <a href="#section-additional" class="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors">
            <span class="flex h-5 w-5 items-center justify-center bg-blue-100 text-blue-700 text-xs font-bold">5</span>
            Additional
          </a>
        </nav>

        <!-- Bottom Actions -->
        <div class="p-4 border-t border-slate-100 space-y-2">
          <button
            type="button"
            data-action="openai-settings"
            class="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            AI Settings
          </button>
          <button
            type="button"
            data-action="import-github"
            class="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path fill-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clip-rule="evenodd" />
            </svg>
            Import from GitHub
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <!-- Top Header -->
        <header class="sticky top-0 z-20 bg-white border-b border-slate-200 px-6 py-4">
          <div class="flex items-center justify-between gap-4">
            <!-- Left: Title and Status -->
            <div class="flex items-center gap-4 min-w-0">
              <div class="min-w-0">
                <h1 class="text-lg font-semibold text-slate-900 truncate" data-role="cv-title">${model.project.title}</h1>
                <div class="flex items-center gap-2 mt-0.5">
                  <span class="text-xs text-slate-500">${model.project.id}</span>
                  <span class="text-slate-300">·</span>
                  <span data-role="save-status" class="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                    <span class="w-1.5 h-1.5 bg-emerald-600"></span>
                    Saved
                  </span>
                </div>
              </div>
            </div>

            <!-- Right: Actions -->
            <div class="flex items-center gap-2 shrink-0">
              <button
                type="button"
                data-action="undo"
                class="inline-flex items-center gap-2 px-3 py-2 border border-slate-200 bg-white text-slate-900 text-sm font-medium hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                disabled
              >
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v6h6" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 17a9 9 0 00-15-6l-3 3" />
                </svg>
                Undo
              </button>
              <button
                type="button"
                data-action="redo"
                class="inline-flex items-center gap-2 px-3 py-2 border border-slate-200 bg-white text-slate-900 text-sm font-medium hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                disabled
              >
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 7v6h-6" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 17a9 9 0 0015-6l3-3" />
                </svg>
                Redo
              </button>
              <button
                type="button"
                data-action="export-pdf"
                class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors btn-active"
              >
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export PDF
              </button>
            </div>
          </div>
        </header>

        <!-- Editor Content -->
        <div class="flex-1 min-h-0 overflow-hidden">
          <div class="grid grid-cols-1 lg:grid-cols-2 h-full min-h-0">
            <!-- Editor Panel -->
            <div class="min-h-0 overflow-y-auto overscroll-contain bg-slate-50/50 border-r border-slate-200">
              <div class="max-w-2xl mx-auto p-6 space-y-6">
                <!-- Basics Section -->
                <details id="section-basics" data-role="section-basics" class="group bg-white border border-slate-200 overflow-hidden" open>
                  <summary class="px-5 py-4 bg-slate-50/50 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden [&::marker]:content-[''] flex items-start justify-between gap-4">
                    <div>
                      <h2 class="text-sm font-semibold text-slate-900">Basic Information</h2>
                      <p class="text-xs text-slate-500 mt-0.5">Your contact details and professional summary</p>
                    </div>
                    <div class="text-slate-400 transition-transform group-open:rotate-180" aria-hidden="true">
                      <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </summary>
                  <div class="p-5 space-y-4 border-t border-slate-100">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1.5">Full name</label>
                        <input 
                          type="text" 
                          data-field="fullName"
                          class="w-full px-3 py-2 bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1.5">Headline</label>
                        <input 
                          type="text" 
                          data-field="headline"
                          class="w-full px-3 py-2 bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                          placeholder="Senior Software Engineer"
                        />
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                        <input 
                          type="email" 
                          data-field="email"
                          class="w-full px-3 py-2 bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                          placeholder="john@example.com"
                        />
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1.5">Phone</label>
                        <input 
                          type="tel" 
                          data-field="phone"
                          class="w-full px-3 py-2 bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                      <div class="sm:col-span-2">
                        <label class="block text-sm font-medium text-slate-700 mb-1.5">Location</label>
                        <input 
                          type="text" 
                          data-field="location"
                          class="w-full px-3 py-2 bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                          placeholder="San Francisco, CA"
                        />
                      </div>
                      <div class="sm:col-span-2">
                        <label class="block text-sm font-medium text-slate-700 mb-1.5">Links <span class="text-slate-400 font-normal">(one per line)</span></label>
                        <textarea 
                          data-field="links"
                          rows="3"
                          class="w-full px-3 py-2 bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow resize-none"
                          placeholder="https://linkedin.com/in/johndoe"
                        ></textarea>
                      </div>
                      <div class="sm:col-span-2">
                        <div class="flex items-center justify-between mb-1.5">
                          <label class="block text-sm font-medium text-slate-700">Summary</label>
                          <button
                            type="button"
                            data-action="generate-summary"
                            class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 hover:bg-purple-100 transition-colors"
                          >
                            <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Generate with AI
                          </button>
                        </div>
                        <textarea 
                          data-field="summary"
                          rows="5"
                          class="w-full px-3 py-2 bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow resize-none"
                          placeholder="Write a brief summary of your professional background..."
                        ></textarea>
                        <div class="mt-1.5 flex items-center gap-2 text-xs">
                          <span data-role="summary-ai-status" class="text-slate-500"></span>
                          <button
                            type="button"
                            data-action="undo-summary-ai"
                            class="hidden text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Undo
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </details>

                <!-- Experience Section -->
                <details id="section-experience" data-role="section-experience" class="group bg-white border border-slate-200 overflow-hidden" open>
                  <summary class="px-5 py-4 bg-slate-50/50 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden [&::marker]:content-[''] flex items-start justify-between gap-4">
                    <div>
                      <h2 class="text-sm font-semibold text-slate-900">Experience</h2>
                      <p class="text-xs text-slate-500 mt-0.5" data-role="meta-experience"></p>
                    </div>
                    <div class="flex items-center gap-2">
                      <button
                        type="button"
                        data-action="add-experience"
                        class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors"
                      >
                        <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Add
                      </button>
                      <div class="text-slate-400 transition-transform group-open:rotate-180" aria-hidden="true">
                        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </summary>
                  <div class="p-5 border-t border-slate-100">
                    <div data-role="experience-list" class="space-y-4"></div>
                  </div>
                </details>

                <!-- Education Section -->
                <details id="section-education" data-role="section-education" class="group bg-white border border-slate-200 overflow-hidden" open>
                  <summary class="px-5 py-4 bg-slate-50/50 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden [&::marker]:content-[''] flex items-start justify-between gap-4">
                    <div>
                      <h2 class="text-sm font-semibold text-slate-900">Education</h2>
                      <p class="text-xs text-slate-500 mt-0.5" data-role="meta-education"></p>
                    </div>
                    <div class="flex items-center gap-2">
                      <button
                        type="button"
                        data-action="add-education"
                        class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors"
                      >
                        <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Add
                      </button>
                      <div class="text-slate-400 transition-transform group-open:rotate-180" aria-hidden="true">
                        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </summary>
                  <div class="p-5 border-t border-slate-100">
                    <div data-role="education-list" class="space-y-4"></div>
                  </div>
                </details>

                <!-- Skills Section -->
                <details id="section-skills" data-role="section-skills" class="group bg-white border border-slate-200 overflow-hidden" open>
                  <summary class="px-5 py-4 bg-slate-50/50 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden [&::marker]:content-[''] flex items-start justify-between gap-4">
                    <div>
                      <h2 class="text-sm font-semibold text-slate-900">Skills</h2>
                      <p class="text-xs text-slate-500 mt-0.5"><span data-role="meta-skills">0 skills</span></p>
                    </div>
                    <div class="text-slate-400 transition-transform group-open:rotate-180" aria-hidden="true">
                      <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </summary>
                  <div class="p-5 border-t border-slate-100">
                    <div class="space-y-3" data-role="skills-editor">
                      <div data-role="skills-chips" class="flex flex-wrap gap-2"></div>

                      <div class="flex items-center gap-2">
                        <input
                          type="text"
                          data-field="skills-input"
                          class="flex-1 min-w-0 px-3 py-2 bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                          placeholder="Type a skill and press Enter"
                          autocomplete="off"
                          spellcheck="false"
                        />
                        <button
                          type="button"
                          data-action="skills-add"
                          class="px-3 py-2 border border-slate-200 bg-white text-slate-900 text-sm font-medium hover:bg-slate-50 transition-colors"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          data-action="generate-skills"
                          class="px-3 py-2 border border-slate-200 bg-white text-slate-900 text-sm font-medium hover:bg-slate-50 transition-colors"
                        >
                          Generate with AI
                        </button>
                        <button
                          type="button"
                          data-action="undo-skills-ai"
                          class="px-3 py-2 border border-slate-200 bg-white text-slate-900 text-sm font-medium hover:bg-slate-50 transition-colors hidden"
                        >
                          Undo AI
                        </button>
                      </div>

                      <div data-role="skills-ai-status" class="text-xs text-slate-500"></div>

                      <div class="text-xs text-slate-500">
                        Press <span class="font-medium">Enter</span> or type <span class="font-medium">,</span> to add.
                        Paste multiple skills (comma or newline separated).
                      </div>
                      <div data-role="skills-hint" class="hidden text-xs text-slate-500"></div>
                    </div>
                  </div>
                </details>

                <!-- Additional Sections -->
                <details id="section-additional" data-role="section-additional" class="group bg-white border border-slate-200 overflow-hidden" open>
                  <summary class="px-5 py-4 bg-slate-50/50 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden [&::marker]:content-[''] flex items-start justify-between gap-4">
                    <div>
                      <h2 class="text-sm font-semibold text-slate-900">Additional Sections</h2>
                      <p class="text-xs text-slate-500 mt-0.5">Toggle sections on/off and add entries</p>
                    </div>
                    <div class="text-slate-400 transition-transform group-open:rotate-180" aria-hidden="true">
                      <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </summary>
                  <div class="p-5 space-y-4 border-t border-slate-100">
                    <!-- Projects -->
                    <details data-role="section-projects" class="group border border-slate-200 overflow-hidden" ${currentCv.sections.projects ? "open" : ""}>
                      <summary class="px-4 py-3 bg-slate-50 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden [&::marker]:content-[''] flex items-center justify-between gap-4">
                        <div class="flex items-center gap-3 min-w-0">
                          <div class="flex items-center gap-2" data-role="toggle-projects">
                            <label class="flex items-center gap-2 cursor-pointer">
                              <input 
                                type="checkbox" 
                                data-field="toggle-projects"
                                class="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                                ${currentCv.sections.projects ? 'checked' : ''}
                              />
                              <span class="text-sm font-medium text-slate-700">Projects</span>
                            </label>
                          </div>
                          <span class="text-xs text-slate-400 truncate" data-role="meta-projects"></span>
                        </div>
                        <div class="flex items-center gap-2">
                          <button
                            type="button"
                            data-action="add-project"
                            class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50 transition-colors"
                          >
                            <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                            </svg>
                            Add
                          </button>
                          <div class="text-slate-400 transition-transform group-open:rotate-180" aria-hidden="true">
                            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </summary>
                      <div class="p-4 border-t border-slate-200 ${currentCv.sections.projects ? '' : 'hidden'}">
                        <div data-role="projects-list" class="space-y-4"></div>
                      </div>
                    </details>

                    <!-- Certifications -->
                    <details data-role="section-certifications" class="group border border-slate-200 overflow-hidden" ${currentCv.sections.certifications ? "open" : ""}>
                      <summary class="px-4 py-3 bg-slate-50 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden [&::marker]:content-[''] flex items-center justify-between gap-4">
                        <div class="flex items-center gap-3 min-w-0">
                          <div class="flex items-center gap-2" data-role="toggle-certifications">
                            <label class="flex items-center gap-2 cursor-pointer">
                              <input 
                                type="checkbox" 
                                data-field="toggle-certifications"
                                class="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                                ${currentCv.sections.certifications ? 'checked' : ''}
                              />
                              <span class="text-sm font-medium text-slate-700">Certifications</span>
                            </label>
                          </div>
                          <span class="text-xs text-slate-400 truncate" data-role="meta-certifications"></span>
                        </div>
                        <div class="flex items-center gap-2">
                          <button
                            type="button"
                            data-action="add-certification"
                            class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50 transition-colors"
                          >
                            <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                            </svg>
                            Add
                          </button>
                          <div class="text-slate-400 transition-transform group-open:rotate-180" aria-hidden="true">
                            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </summary>
                      <div class="p-4 border-t border-slate-200 ${currentCv.sections.certifications ? '' : 'hidden'}">
                        <div data-role="certifications-list" class="space-y-4"></div>
                      </div>
                    </details>

                    <!-- Awards -->
                    <details data-role="section-awards" class="group border border-slate-200 overflow-hidden" ${currentCv.sections.awards ? "open" : ""}>
                      <summary class="px-4 py-3 bg-slate-50 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden [&::marker]:content-[''] flex items-center justify-between gap-4">
                        <div class="flex items-center gap-3 min-w-0">
                          <div class="flex items-center gap-2" data-role="toggle-awards">
                            <label class="flex items-center gap-2 cursor-pointer">
                              <input 
                                type="checkbox" 
                                data-field="toggle-awards"
                                class="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                                ${currentCv.sections.awards ? 'checked' : ''}
                              />
                              <span class="text-sm font-medium text-slate-700">Awards</span>
                            </label>
                          </div>
                          <span class="text-xs text-slate-400 truncate" data-role="meta-awards"></span>
                        </div>
                        <div class="flex items-center gap-2">
                          <button
                            type="button"
                            data-action="add-award"
                            class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50 transition-colors"
                          >
                            <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                            </svg>
                            Add
                          </button>
                          <div class="text-slate-400 transition-transform group-open:rotate-180" aria-hidden="true">
                            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </summary>
                      <div class="p-4 border-t border-slate-200 ${currentCv.sections.awards ? '' : 'hidden'}">
                        <div data-role="awards-list" class="space-y-4"></div>
                      </div>
                    </details>

                    <!-- Publications -->
                    <details data-role="section-publications" class="group border border-slate-200 overflow-hidden" ${currentCv.sections.publications ? "open" : ""}>
                      <summary class="px-4 py-3 bg-slate-50 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden [&::marker]:content-[''] flex items-center justify-between gap-4">
                        <div class="flex items-center gap-3 min-w-0">
                          <div class="flex items-center gap-2" data-role="toggle-publications">
                            <label class="flex items-center gap-2 cursor-pointer">
                              <input 
                                type="checkbox" 
                                data-field="toggle-publications"
                                class="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                                ${currentCv.sections.publications ? 'checked' : ''}
                              />
                              <span class="text-sm font-medium text-slate-700">Publications</span>
                            </label>
                          </div>
                          <span class="text-xs text-slate-400 truncate" data-role="meta-publications"></span>
                        </div>
                        <div class="flex items-center gap-2">
                          <button
                            type="button"
                            data-action="add-publication"
                            class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50 transition-colors"
                          >
                            <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                            </svg>
                            Add
                          </button>
                          <div class="text-slate-400 transition-transform group-open:rotate-180" aria-hidden="true">
                            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </summary>
                      <div class="p-4 border-t border-slate-200 ${currentCv.sections.publications ? '' : 'hidden'}">
                        <div data-role="publications-list" class="space-y-4"></div>
                      </div>
                    </details>

                    <!-- Volunteering -->
                    <details data-role="section-volunteering" class="group border border-slate-200 overflow-hidden" ${currentCv.sections.volunteering ? "open" : ""}>
                      <summary class="px-4 py-3 bg-slate-50 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden [&::marker]:content-[''] flex items-center justify-between gap-4">
                        <div class="flex items-center gap-3 min-w-0">
                          <div class="flex items-center gap-2" data-role="toggle-volunteering">
                            <label class="flex items-center gap-2 cursor-pointer">
                              <input 
                                type="checkbox" 
                                data-field="toggle-volunteering"
                                class="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                                ${currentCv.sections.volunteering ? 'checked' : ''}
                              />
                              <span class="text-sm font-medium text-slate-700">Volunteering</span>
                            </label>
                          </div>
                          <span class="text-xs text-slate-400 truncate" data-role="meta-volunteering"></span>
                        </div>
                        <div class="flex items-center gap-2">
                          <button
                            type="button"
                            data-action="add-volunteering"
                            class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50 transition-colors"
                          >
                            <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                            </svg>
                            Add
                          </button>
                          <div class="text-slate-400 transition-transform group-open:rotate-180" aria-hidden="true">
                            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </summary>
                      <div class="p-4 border-t border-slate-200 ${currentCv.sections.volunteering ? '' : 'hidden'}">
                        <div data-role="volunteering-list" class="space-y-4"></div>
                      </div>
                    </details>
                  </div>
                </details>
              </div>
            </div>

            <!-- Preview Panel -->
            <div class="hidden lg:flex flex-col min-h-0 bg-slate-100 border-l border-slate-200 overflow-hidden">
              <div class="px-5 py-3 border-b border-slate-200 bg-white flex items-center justify-between">
                <div>
                  <h2 class="text-sm font-semibold text-slate-900">Preview</h2>
                  <p class="text-xs text-slate-500">This is how your CV will look when exported</p>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-xs text-slate-500" data-role="preview-pages"></span>
                </div>
              </div>
              <div class="flex-1 min-h-0 p-6">
                <div class="h-full overflow-auto overscroll-contain" data-role="preview-viewport">
                  <div class="max-w-[210mm] mx-auto bg-white shadow-lg overflow-hidden">
                    <div class="aspect-210/297 w-full" data-role="preview-frame-center">
                      <div data-role="preview-frame-wrap" class="w-full h-full">
                        <iframe
                          class="w-full h-full border-0 bg-white"
                          data-role="cv-preview"
                          title="CV Preview"
                        ></iframe>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  `;
}
