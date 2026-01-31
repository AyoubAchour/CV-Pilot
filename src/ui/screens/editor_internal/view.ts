import type { CvDocument } from "../../../shared/cv-model";

export function renderEditorHtml(model: { project: ProjectSummary }, currentCv: CvDocument): string {
  return `
    <div class="flex min-h-screen">
      <aside class="w-56 shrink-0 bg-slate-800">
        <div class="flex h-full flex-col">
          <div class="flex items-center gap-2 px-4 py-4">
            <div class="flex h-8 w-8 items-center justify-center bg-blue-600 text-xs font-bold text-white">
              CV
            </div>
            <span class="text-sm font-semibold text-white">CV Pilot</span>
          </div>

          <nav class="mt-2 flex-1 px-2">
            <a
              href="#"
              class="flex items-center gap-2 rounded px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white"
              data-action="back"
            >
              <i data-lucide="arrow-left" class="h-4 w-4"></i>
              Back
            </a>
          </nav>
        </div>
      </aside>

      <main class="flex-1 bg-slate-100">
        <div class="border-b border-slate-200 bg-white px-6 py-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 class="text-lg font-semibold text-slate-900" data-role="cv-title">${model.project.title}</h1>
              <p class="mt-0.5 text-xs text-slate-500">Editor · ${model.project.id}</p>
            </div>

            <div class="flex items-center gap-3">
              <span data-role="save-status" class="text-xs font-medium text-slate-600">Saved</span>

              <button
                type="button"
                class="inline-flex items-center gap-2 border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-sm hover:bg-slate-50"
                data-action="openai-settings"
              >
                AI Settings
              </button>

              <button
                type="button"
                class="inline-flex items-center gap-2 border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-sm hover:bg-slate-50"
                data-action="import-github"
              >
                Import from GitHub
              </button>

              <button
                type="button"
                class="inline-flex items-center gap-2 border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-sm hover:bg-slate-50"
                data-action="export-pdf"
              >
                <i data-lucide="file-down" class="h-4 w-4"></i>
                Export PDF
              </button>

              <button
                type="button"
                class="inline-flex items-center gap-2 border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-sm hover:bg-slate-50"
                data-action="back"
              >
                <i data-lucide="arrow-left" class="h-4 w-4"></i>
                Back
              </button>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-6 p-6 lg:grid-cols-[minmax(0,40%)_minmax(0,60%)] lg:items-start">
          <section class="border border-slate-200 bg-white shadow-sm">
            <div class="border-b border-slate-200 px-4 py-3">
              <h2 class="text-sm font-semibold text-slate-900">Edit</h2>
              <p class="mt-1 text-xs text-slate-500">Changes auto-save and reflect in the preview.</p>
            </div>

            <div class="space-y-6 p-4">
              <div>
                <h3 class="text-xs font-semibold uppercase tracking-wide text-slate-500">Basics</h3>
                <div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label class="block">
                    <span class="text-xs font-medium text-slate-700">Full name</span>
                    <input class="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm" data-field="fullName" />
                  </label>

                  <label class="block">
                    <span class="text-xs font-medium text-slate-700">Headline</span>
                    <input class="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm" data-field="headline" />
                  </label>

                  <label class="block">
                    <span class="text-xs font-medium text-slate-700">Email</span>
                    <input class="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm" data-field="email" />
                  </label>

                  <label class="block">
                    <span class="text-xs font-medium text-slate-700">Phone</span>
                    <input class="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm" data-field="phone" />
                  </label>

                  <label class="block">
                    <span class="text-xs font-medium text-slate-700">Location</span>
                    <input class="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm" data-field="location" />
                  </label>

                  <label class="block sm:col-span-2">
                    <span class="text-xs font-medium text-slate-700">Links (one per line)</span>
                    <textarea class="mt-1 min-h-18 w-full rounded border border-slate-200 px-3 py-2 text-sm" data-field="links"></textarea>
                  </label>

                  <label class="block sm:col-span-2">
                    <span class="text-xs font-medium text-slate-700">Summary</span>
                    <textarea class="mt-1 min-h-24 w-full rounded border border-slate-200 px-3 py-2 text-sm" data-field="summary"></textarea>
                  </label>
                </div>
              </div>

              <details class="rounded border border-slate-200 bg-white" data-role="section-experience" open>
                <summary class="flex cursor-pointer items-start justify-between gap-3 bg-slate-50 px-3 py-2 text-left [&::-webkit-details-marker]:hidden">
                  <div class="min-w-0">
                    <div class="text-xs font-semibold uppercase tracking-wide text-slate-500">Experience</div>
                    <div class="mt-0.5 text-xs text-slate-500" data-role="meta-experience"></div>
                  </div>
                  <button
                    type="button"
                    class="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-900 hover:bg-slate-50"
                    data-action="add-experience"
                  >
                    <i data-lucide="plus" class="h-3.5 w-3.5"></i>
                    Add
                  </button>
                </summary>
                <div class="px-3 pb-3 pt-3">
                  <div class="space-y-4" data-role="experience-list"></div>
                </div>
              </details>

              <details class="rounded border border-slate-200 bg-white" data-role="section-education" open>
                <summary class="flex cursor-pointer items-start justify-between gap-3 bg-slate-50 px-3 py-2 text-left [&::-webkit-details-marker]:hidden">
                  <div class="min-w-0">
                    <div class="text-xs font-semibold uppercase tracking-wide text-slate-500">Education</div>
                    <div class="mt-0.5 text-xs text-slate-500" data-role="meta-education"></div>
                  </div>
                  <button
                    type="button"
                    class="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-900 hover:bg-slate-50"
                    data-action="add-education"
                  >
                    <i data-lucide="plus" class="h-3.5 w-3.5"></i>
                    Add
                  </button>
                </summary>
                <div class="px-3 pb-3 pt-3">
                  <div class="space-y-4" data-role="education-list"></div>
                </div>
              </details>

              <div>
                <h3 class="text-xs font-semibold uppercase tracking-wide text-slate-500">Skills (one per line)</h3>
                <textarea class="mt-3 min-h-24 w-full rounded border border-slate-200 px-3 py-2 text-sm" data-field="skills"></textarea>
              </div>

              <div>
                <h3 class="text-xs font-semibold uppercase tracking-wide text-slate-500">Additional sections</h3>
                <p class="mt-1 text-xs text-slate-500">Toggle on what you want to show, then expand to edit.</p>

                <details class="mt-3 rounded border border-slate-200 bg-white" data-role="section-projects" ${
                  currentCv.sections.projects ? "open" : ""
                }>
                  <summary class="flex cursor-pointer items-start justify-between gap-3 bg-slate-50 px-3 py-2 text-left [&::-webkit-details-marker]:hidden">
                    <div class="min-w-0">
                      <div class="text-xs font-semibold uppercase tracking-wide text-slate-500">Projects</div>
                      <div class="mt-0.5 text-xs text-slate-500" data-role="meta-projects"></div>
                    </div>
                    <div class="flex items-center gap-2">
                      <label class="flex items-center gap-2 text-xs font-semibold text-slate-700" data-role="toggle-projects">
                        <input type="checkbox" class="h-4 w-4 rounded border-slate-300" data-field="toggle-projects" />
                        Show
                      </label>
                      <button
                        type="button"
                        class="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-900 hover:bg-slate-50"
                        data-action="add-project"
                      >
                        <i data-lucide="plus" class="h-3.5 w-3.5"></i>
                        Add
                      </button>
                    </div>
                  </summary>
                  <div class="px-3 pb-3 pt-3">
                    <div class="space-y-4" data-role="projects-list"></div>
                  </div>
                </details>

                <details class="mt-3 rounded border border-slate-200 bg-white" data-role="section-certifications" ${
                  currentCv.sections.certifications ? "open" : ""
                }>
                  <summary class="flex cursor-pointer items-start justify-between gap-3 bg-slate-50 px-3 py-2 text-left [&::-webkit-details-marker]:hidden">
                    <div class="min-w-0">
                      <div class="text-xs font-semibold uppercase tracking-wide text-slate-500">Certifications</div>
                      <div class="mt-0.5 text-xs text-slate-500" data-role="meta-certifications"></div>
                    </div>
                    <div class="flex items-center gap-2">
                      <label class="flex items-center gap-2 text-xs font-semibold text-slate-700" data-role="toggle-certifications">
                        <input type="checkbox" class="h-4 w-4 rounded border-slate-300" data-field="toggle-certifications" />
                        Show
                      </label>
                      <button
                        type="button"
                        class="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-900 hover:bg-slate-50"
                        data-action="add-certification"
                      >
                        <i data-lucide="plus" class="h-3.5 w-3.5"></i>
                        Add
                      </button>
                    </div>
                  </summary>
                  <div class="px-3 pb-3 pt-3">
                    <div class="space-y-4" data-role="certifications-list"></div>
                  </div>
                </details>

                <details class="mt-3 rounded border border-slate-200 bg-white" data-role="section-awards" ${
                  currentCv.sections.awards ? "open" : ""
                }>
                  <summary class="flex cursor-pointer items-start justify-between gap-3 bg-slate-50 px-3 py-2 text-left [&::-webkit-details-marker]:hidden">
                    <div class="min-w-0">
                      <div class="text-xs font-semibold uppercase tracking-wide text-slate-500">Awards</div>
                      <div class="mt-0.5 text-xs text-slate-500" data-role="meta-awards"></div>
                    </div>
                    <div class="flex items-center gap-2">
                      <label class="flex items-center gap-2 text-xs font-semibold text-slate-700" data-role="toggle-awards">
                        <input type="checkbox" class="h-4 w-4 rounded border-slate-300" data-field="toggle-awards" />
                        Show
                      </label>
                      <button
                        type="button"
                        class="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-900 hover:bg-slate-50"
                        data-action="add-award"
                      >
                        <i data-lucide="plus" class="h-3.5 w-3.5"></i>
                        Add
                      </button>
                    </div>
                  </summary>
                  <div class="px-3 pb-3 pt-3">
                    <div class="space-y-4" data-role="awards-list"></div>
                  </div>
                </details>

                <details class="mt-3 rounded border border-slate-200 bg-white" data-role="section-publications" ${
                  currentCv.sections.publications ? "open" : ""
                }>
                  <summary class="flex cursor-pointer items-start justify-between gap-3 bg-slate-50 px-3 py-2 text-left [&::-webkit-details-marker]:hidden">
                    <div class="min-w-0">
                      <div class="text-xs font-semibold uppercase tracking-wide text-slate-500">Publications</div>
                      <div class="mt-0.5 text-xs text-slate-500" data-role="meta-publications"></div>
                    </div>
                    <div class="flex items-center gap-2">
                      <label class="flex items-center gap-2 text-xs font-semibold text-slate-700" data-role="toggle-publications">
                        <input type="checkbox" class="h-4 w-4 rounded border-slate-300" data-field="toggle-publications" />
                        Show
                      </label>
                      <button
                        type="button"
                        class="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-900 hover:bg-slate-50"
                        data-action="add-publication"
                      >
                        <i data-lucide="plus" class="h-3.5 w-3.5"></i>
                        Add
                      </button>
                    </div>
                  </summary>
                  <div class="px-3 pb-3 pt-3">
                    <div class="space-y-4" data-role="publications-list"></div>
                  </div>
                </details>

                <details class="mt-3 rounded border border-slate-200 bg-white" data-role="section-volunteering" ${
                  currentCv.sections.volunteering ? "open" : ""
                }>
                  <summary class="flex cursor-pointer items-start justify-between gap-3 bg-slate-50 px-3 py-2 text-left [&::-webkit-details-marker]:hidden">
                    <div class="min-w-0">
                      <div class="text-xs font-semibold uppercase tracking-wide text-slate-500">Volunteering</div>
                      <div class="mt-0.5 text-xs text-slate-500" data-role="meta-volunteering"></div>
                    </div>
                    <div class="flex items-center gap-2">
                      <label class="flex items-center gap-2 text-xs font-semibold text-slate-700" data-role="toggle-volunteering">
                        <input type="checkbox" class="h-4 w-4 rounded border-slate-300" data-field="toggle-volunteering" />
                        Show
                      </label>
                      <button
                        type="button"
                        class="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-900 hover:bg-slate-50"
                        data-action="add-volunteering"
                      >
                        <i data-lucide="plus" class="h-3.5 w-3.5"></i>
                        Add
                      </button>
                    </div>
                  </summary>
                  <div class="px-3 pb-3 pt-3">
                    <div class="space-y-4" data-role="volunteering-list"></div>
                  </div>
                </details>
              </div>
            </div>
          </section>

          <section class="border border-slate-200 bg-white shadow-sm lg:sticky lg:top-6 lg:self-start">
            <div class="border-b border-slate-200 px-4 py-3">
              <h2 class="text-sm font-semibold text-slate-900">Preview</h2>
              <p class="mt-1 text-xs text-slate-500">This is the exact HTML that will be printed to PDF.</p>
              <p class="mt-1 text-xs font-medium text-slate-600" data-role="preview-pages"></p>
            </div>
            <div class="p-0">
              <div class="aspect-210/297 w-full overflow-y-auto overflow-x-hidden rounded bg-white shadow-sm" data-role="preview-viewport">
                <div class="flex items-center justify-center" data-role="preview-frame-center">
                  <div data-role="preview-frame-wrap" style="overflow:hidden;">
                    <iframe
                      class="block border-0 bg-white"
                      data-role="cv-preview"
                      title="CV Preview"
                    ></iframe>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  `;
}
