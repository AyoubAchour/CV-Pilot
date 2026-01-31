import type { CvDocument } from "../../../shared/cv-model";
import type { OpenAiRepoContext } from "../../../shared/openai-types";
import type {
  GitHubAuthBeginResult,
  GitHubRepoSummary,
  GitHubUserProfile,
} from "../../../shared/github-types";

import { cloneCv } from "./helpers";

type BindGitHubImportModalArgs = {
  root: HTMLElement;
  getCv: () => CvDocument;
  setCv: (next: CvDocument) => void;
  onApplied?: (prev: CvDocument, next: CvDocument) => void;
};

type InlineMessage = {
  kind: "info" | "error" | "success";
  text: string;
  details?: string[];
};

export function bindGitHubImportModal({
  root,
  getCv,
  setCv,
  onApplied,
}: BindGitHubImportModalArgs): void {
  const importGithubButton = root.querySelector<HTMLButtonElement>(
    '[data-action="import-github"]'
  );

  if (!importGithubButton) {
    return;
  }

  let isImportingGithub = false;

  const openGithubImportModal = async () => {
    if (isImportingGithub) {
      return;
    }
    isImportingGithub = true;

    let pollTimer: number | null = null;
    let shouldPoll = false;
    let isBusy = false;
    let includePrivate = false;

    let auth: GitHubAuthBeginResult | null = null;
    let authMessage: string | null = null;

    let profile: GitHubUserProfile | null = null;
    let repos: GitHubRepoSummary[] = [];
    let repoFilter = "";

    const selectedRepoIds = new Set<number>();
    let readmeStatus: string | null = null;
    let applyStage: "idle" | "readmes" | "openai" = "idle";
    let inlineMessage: InlineMessage | null = null;

    const overlay = document.createElement("div");
    overlay.className =
      "fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    root.appendChild(overlay);

    const stopPolling = () => {
      shouldPoll = false;
      if (pollTimer !== null) {
        window.clearTimeout(pollTimer);
        pollTimer = null;
      }
    };

    const cleanup = () => {
      stopPolling();
      overlay.remove();
      isImportingGithub = false;
    };

    // Close when clicking the dimmed background.
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        if (isBusy) {
          inlineMessage = {
            kind: "info",
            text: "Working… please wait until the operation finishes.",
          };
          render();
          return;
        }
        cleanup();
      }
    });

    const escapeHtml = (value: string): string =>
      value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");

    const safeUrl = (value: string | null | undefined): string | null => {
      const v = (value ?? "").trim();
      if (!v) return null;
      try {
        const u = new URL(v);
        if (u.protocol !== "https:" && u.protocol !== "http:") return null;
        return u.toString();
      } catch {
        return null;
      }
    };

    const uniqueNonEmptyLines = (
      values: Array<string | null | undefined>
    ): string[] => {
      const out: string[] = [];
      const seen = new Set<string>();
      for (const value of values) {
        const trimmed = (value ?? "").trim();
        if (!trimmed) continue;
        const key = trimmed.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(trimmed);
      }
      return out;
    };

    const formatRepoDate = (repo: GitHubRepoSummary): string => {
      const raw = repo.pushedAt ?? repo.updatedAt;
      const d = new Date(raw);
      return Number.isFinite(d.getTime()) ? String(d.getFullYear()) : "";
    };

    const normalizeSkillKey = (value: string): string =>
      value
        .trim()
        .replace(/\s+/g, " ")
        .toLowerCase();

    const normalizeAiSkill = (value: string): string | null => {
      const trimmed = value.trim().replace(/\s+/g, " ");
      if (!trimmed) return null;

      const lower = trimmed.toLowerCase();

      const mapped: Record<string, string | null> = {
        "conventional commits": "Git",
        "terminal ui": null,
        "terminal ui (tui)": null,
        "tui": null,
        "repository maintenance": null,
        "configuration management": null,
        "secure local storage": null,
        "desktop application development": null,
        "application development": null,
        "software development": null,
        "software engineering": null,
        "api integration": "REST APIs",
      };

      if (Object.prototype.hasOwnProperty.call(mapped, lower)) {
        return mapped[lower];
      }

      // Trim trailing punctuation.
      return trimmed.replace(/[.,;:]+$/g, "");
    };

    const buildRepoEvidence = (repos: OpenAiRepoContext[]): Set<string> => {
      const evidence = new Set<string>();
      const add = (v: string | null | undefined) => {
        const key = normalizeSkillKey(v ?? "");
        if (key) evidence.add(key);
      };

      const addPackage = (pkg: string) => {
        add(pkg);

        const key = normalizeSkillKey(pkg);
        if (!key) return;

        // Common package-name → resume-skill-name bridges.
        if (key === "tailwindcss") {
          add("Tailwind CSS");
          add("Tailwind");
        }
        if (key === "nodejs") {
          add("Node.js");
        }
        if (key === "next") {
          add("Next.js");
        }
        if (key === "react") {
          add("React");
        }
        if (key.includes("eslint")) {
          add("ESLint");
        }
        if (key.includes("prettier")) {
          add("Prettier");
        }
        if (key.includes("postcss")) {
          add("PostCSS");
        }
        if (key.includes("vite")) {
          add("Vite");
        }
        if (key.includes("electron")) {
          add("Electron");
        }
        if (key.startsWith("@types/")) {
          add(key.slice("@types/".length));
        }
      };

      const addMany = (items: string[] | null | undefined) => {
        for (const item of items ?? []) add(item);
      };

      const addManyPackages = (items: string[] | null | undefined) => {
        for (const item of items ?? []) {
          const trimmed = (item ?? "").trim();
          if (!trimmed) continue;
          addPackage(trimmed);
        }
      };

      for (const repo of repos) {
        add(repo.language);
        addMany(repo.topics);

        for (const lang of Object.keys(repo.languages ?? {})) {
          add(lang);
        }

        addManyPackages(repo.packageJson?.deps);
        addManyPackages(repo.packageJson?.devDeps);

        const flags = repo.treeSummary?.flags ?? [];
        for (const flag of flags) {
          switch (flag) {
            case "has:typescript":
              add("TypeScript");
              break;
            case "has:python":
              add("Python");
              break;
            case "has:rust":
              add("Rust");
              break;
            case "has:go":
              add("Go");
              break;
            case "has:docker":
              add("Docker");
              break;
            case "has:github-actions":
              add("GitHub Actions");
              break;
            case "has:nextjs":
              add("Next.js");
              break;
            case "has:vite":
              add("Vite");
              break;
            default:
              break;
          }
        }
      }

      // Always-allowed baseline technical keywords.
      add("git");
      add("github");
      add("ci/cd");
      add("rest apis");

      return evidence;
    };

    const filterAiSkillsForCv = (
      rawSkills: Array<string | null | undefined>,
      repos: OpenAiRepoContext[]
    ): { skills: string[]; dropped: number } => {
      const evidence = buildRepoEvidence(repos);
      const out: string[] = [];
      const seen = new Set<string>();

      const isVague = (key: string): boolean => {
        const patterns: RegExp[] = [
          /^development$/,
          /^engineering$/,
          /^application( |-)development$/,
          /^desktop( |-)application( |-)development$/,
          /^software( |-)development$/,
          /^software( |-)engineering$/,
          /^repository( |-)maintenance$/,
          /^configuration( |-)management$/,
          /^secure( |-)local( |-)storage$/,
        ];
        return patterns.some((p) => p.test(key));
      };

      let dropped = 0;
      for (const raw of rawSkills ?? []) {
        const normalized = normalizeAiSkill(raw ?? "");
        if (!normalized) {
          dropped += 1;
          continue;
        }

        const key = normalizeSkillKey(normalized);
        if (!key || isVague(key)) {
          dropped += 1;
          continue;
        }

        // Evidence check: keep if it's a known keyword from the repo pack.
        // Also keep if it looks like a common tool name with punctuation.
        const looksTooly = /[.+#/]/.test(normalized);
        if (!looksTooly && !evidence.has(key)) {
          dropped += 1;
          continue;
        }

        if (seen.has(key)) continue;
        seen.add(key);
        out.push(normalized);

        // Keep skills compact.
        if (out.length >= 16) break;
      }

      return { skills: out, dropped };
    };

    const render = () => {
      const activeElement = document.activeElement;
      const isRepoFilterFocused =
        activeElement instanceof HTMLInputElement &&
        activeElement.getAttribute("data-field") === "repo-filter";
      const repoFilterSelection =
        isRepoFilterFocused && activeElement instanceof HTMLInputElement
          ? {
              start: activeElement.selectionStart,
              end: activeElement.selectionEnd,
            }
          : null;
      const repoListScrollTop =
        overlay.querySelector<HTMLElement>("[data-field=repo-list]")?.scrollTop ??
        0;

      const filteredRepos = repoFilter.trim().length
        ? repos.filter((r) =>
            r.fullName
              .toLowerCase()
              .includes(repoFilter.trim().toLowerCase())
          )
        : repos;

      const connected = !!profile;
      const profileLogin = profile?.login ?? "";

      const messageHtml =
        inlineMessage
          ? `<div class="mt-3 rounded border px-3 py-2 text-xs ${
              inlineMessage.kind === "error"
                ? "border-rose-200 bg-rose-50 text-rose-800"
                : inlineMessage.kind === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-slate-200 bg-slate-50 text-slate-700"
            }">
              <div>${escapeHtml(inlineMessage.text)}</div>
              ${
                inlineMessage.details && inlineMessage.details.length > 0
                  ? `<ul class="mt-2 list-disc pl-5">${inlineMessage.details
                      .slice(0, 6)
                      .map((d) => `<li>${escapeHtml(d)}</li>`)
                      .join("")}</ul>`
                  : ""
              }
            </div>`
          : "";

      const spinner =
        '<span class="inline-block h-3 w-3 rounded-full border-2 border-white/60 border-t-white animate-spin"></span>';

      const applyLabel =
        !isBusy
          ? "Apply to CV"
          : applyStage === "readmes"
            ? `${spinner} Building repo context…`
            : applyStage === "openai"
              ? `${spinner} Generating with OpenAI…`
              : `${spinner} Working…`;

      overlay.innerHTML = `
        <div class="w-full max-w-3xl overflow-hidden rounded border border-slate-200 bg-white shadow-lg">
          <div class="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
            <div>
              <h2 class="text-base font-semibold text-slate-900">Import from GitHub</h2>
              <p class="mt-1 text-xs text-slate-500">Connect your GitHub, choose repos, and pull README/context.</p>
            </div>
            <button type="button" class="rounded px-2 py-1 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-60" data-action="close" ${
              isBusy ? "disabled" : ""
            }>✕</button>
          </div>

          <div class="px-5 py-4 space-y-4">
            <div class="flex flex-wrap items-center gap-3">
              <label class="inline-flex items-center gap-2 text-xs font-medium text-slate-700">
                <input type="checkbox" class="h-4 w-4" data-field="include-private" ${
                  includePrivate ? "checked" : ""
                } />
                Include private repos (requires extra permission)
              </label>
            </div>

            <div class="rounded border border-slate-200 bg-slate-50 p-3">
              <div class="text-xs font-semibold text-slate-800">Connection</div>
              <div class="mt-1 text-xs text-slate-600">
                ${
                  connected
                    ? `Connected as <span class="font-semibold">${profileLogin}</span>.`
                    : "Not connected yet."
                }
              </div>

              ${
                auth
                  ? `
                  <div class="mt-3 text-xs text-slate-700">
                    <div>Enter this code on GitHub:</div>
                    <div class="mt-1 inline-flex items-center gap-2">
                      <span class="rounded bg-white px-2 py-1 font-mono text-sm tracking-wider border border-slate-200">${auth.userCode}</span>
                      <button type="button" class="border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-900 hover:bg-slate-50" data-action="copy-code">Copy</button>
                    </div>
                    <div class="mt-2">If the browser didn't open: <a class="text-blue-700 underline" href="#" data-action="show-url">${auth.verificationUri}</a></div>
                    ${
                      authMessage
                        ? `<div class="mt-2 text-xs text-slate-600">${authMessage}</div>`
                        : ""
                    }
                  </div>
                `
                  : ""
              }

              <div class="mt-3 flex flex-wrap items-center gap-2">
                <button type="button" class="bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60" data-action="connect" ${
                  isBusy ? "disabled" : ""
                }>
                  ${connected ? "Reconnect" : "Connect"}
                </button>
                <button type="button" class="border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-sm hover:bg-slate-50 disabled:opacity-60" data-action="disconnect" ${
                  isBusy || !connected ? "disabled" : ""
                }>
                  Disconnect
                </button>
                <span class="text-xs text-slate-600">${isBusy ? "Working…" : ""}</span>
              </div>
            </div>

            <div class="rounded border border-slate-200 bg-white p-3">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <div class="text-xs font-semibold text-slate-800">Repositories</div>
                  <div class="mt-1 text-xs text-slate-600">Pick 5–10 repos that represent your work.</div>
                </div>
                <button type="button" class="border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-sm hover:bg-slate-50 disabled:opacity-60" data-action="load-repos" ${
                  isBusy || !connected ? "disabled" : ""
                }>
                  Load repos
                </button>
              </div>

              <div class="mt-3 flex items-center gap-2">
                <input class="flex-1 min-w-0 rounded border border-slate-200 px-3 py-2 text-xs" placeholder="Filter repos…" value="${repoFilter.replace(
                  /"/g,
                  "&quot;"
                )}" data-field="repo-filter" />
                <button type="button" class="shrink-0 whitespace-nowrap border border-slate-200 bg-white px-2 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-50 disabled:opacity-60" data-action="select-top" ${
                  filteredRepos.length === 0 ? "disabled" : ""
                }>
                  Select top 5
                </button>
              </div>

              <div class="mt-3 max-h-72 overflow-auto rounded border border-slate-200" data-field="repo-list">
                ${
                  filteredRepos.length === 0
                    ? `<div class="p-3 text-xs text-slate-500">No repos loaded yet.</div>`
                    : filteredRepos
                        .slice(0, 200)
                        .map((r) => {
                          const checked = selectedRepoIds.has(r.id)
                            ? "checked"
                            : "";
                          const badge = r.private ? "PRIVATE" : "PUBLIC";
                          return `
                          <label class="flex gap-3 px-3 py-2 text-xs hover:bg-slate-50">
                            <input type="checkbox" class="mt-0.5 h-4 w-4" data-repo-id="${r.id}" ${checked} />
                            <span class="min-w-0 flex-1">
                              <span class="font-semibold text-slate-900">${r.fullName}</span>
                              <span class="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">${badge}</span>
                              ${
                                r.description
                                  ? `<div class="mt-0.5 text-slate-600">${r.description}</div>`
                                  : ""
                              }
                            </span>
                          </label>
                        `;
                        })
                        .join("")
                }
              </div>

              <div class="mt-3 flex flex-wrap items-center justify-between gap-2">
                <div class="text-xs text-slate-600">
                  Selected: <span class="font-semibold text-slate-900">${selectedRepoIds.size}</span>
                </div>
                <div class="flex flex-wrap items-center gap-2">
                  <button type="button" class="bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60 inline-flex items-center gap-2" data-action="apply" ${
                    isBusy || selectedRepoIds.size === 0 || !connected
                      ? "disabled"
                      : ""
                  }>
                    ${applyLabel}
                  </button>
                </div>
              </div>

              ${messageHtml}

              ${
                readmeStatus
                  ? `<div class="mt-2 text-xs text-slate-600">${escapeHtml(readmeStatus)}</div>`
                  : ""
              }
            </div>
          </div>

          <div class="border-t border-slate-200 bg-white px-5 py-3 flex items-center justify-end gap-2">
            <button type="button" class="border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-sm hover:bg-slate-50 disabled:opacity-60" data-action="close" ${
              isBusy ? "disabled" : ""
            }>Close</button>
          </div>
        </div>
      `;

      // Restore scroll + focus after DOM refresh.
      const repoList = overlay.querySelector<HTMLElement>("[data-field=repo-list]");
      if (repoList) {
        repoList.scrollTop = repoListScrollTop;
      }
      if (isRepoFilterFocused) {
        const repoFilterInput = overlay.querySelector<HTMLInputElement>(
          "[data-field=repo-filter]"
        );
        if (repoFilterInput) {
          repoFilterInput.focus();
          if (
            repoFilterSelection?.start !== null &&
            repoFilterSelection?.start !== undefined &&
            repoFilterSelection?.end !== null &&
            repoFilterSelection?.end !== undefined
          ) {
            try {
              repoFilterInput.setSelectionRange(
                repoFilterSelection.start,
                repoFilterSelection.end
              );
            } catch {
              // ignore
            }
          }
        }
      }

      overlay.querySelectorAll<HTMLElement>("[data-action=close]").forEach((btn) => {
        btn.addEventListener("click", () => {
          if (isBusy) {
            inlineMessage = {
              kind: "info",
              text: "Working… please wait until the operation finishes.",
            };
            render();
            return;
          }
          cleanup();
        });
      });

      overlay
        .querySelector<HTMLInputElement>("[data-field=include-private]")
        ?.addEventListener("change", (e) => {
          includePrivate = (e.target as HTMLInputElement).checked;
        });

      overlay
        .querySelector<HTMLInputElement>("[data-field=repo-filter]")
        ?.addEventListener("input", (e) => {
          repoFilter = (e.target as HTMLInputElement).value;
          render();
        });

      overlay
        .querySelector<HTMLElement>("[data-action=copy-code]")
        ?.addEventListener("click", async () => {
          if (!auth) return;
          try {
            await navigator.clipboard.writeText(auth.userCode);
            authMessage = "Copied code to clipboard.";
          } catch {
            authMessage = "Copy failed. Please copy manually.";
          }
          render();
        });

      overlay
        .querySelector<HTMLElement>("[data-action=show-url]")
        ?.addEventListener("click", (e) => {
          e.preventDefault();
          if (!auth) return;
          window.alert(`Open this in your browser: ${auth.verificationUri}`);
        });

      overlay
        .querySelector<HTMLElement>("[data-action=connect]")
        ?.addEventListener("click", async () => {
          if (isBusy) return;
          isBusy = true;
          inlineMessage = null;
          authMessage = null;
          readmeStatus = null;
          // Context pack status

          try {
            auth = await window.cvPilot.githubBeginAuth({ includePrivate });
            authMessage = "Waiting for authorization…";
            shouldPoll = true;

            const poll = async (intervalSeconds: number) => {
              if (!shouldPoll || !auth) return;
              try {
                const result = await window.cvPilot.githubPollAuth({
                  sessionId: auth.sessionId,
                });
                if (result.status === "authorized") {
                  shouldPoll = false;
                  auth = null;
                  authMessage = null;
                  try {
                    profile = await window.cvPilot.githubGetProfile();
                  } catch {
                    profile = null;
                  }
                  render();
                  return;
                }
                if (result.status === "denied" || result.status === "expired") {
                  shouldPoll = false;
                  authMessage = result.message ?? "Authorization stopped.";
                  render();
                  return;
                }
                if (result.status === "error") {
                  shouldPoll = false;
                  authMessage = result.message ?? "Authorization failed.";
                  render();
                  return;
                }

                const nextInterval = result.interval ?? intervalSeconds;
                if (result.message) {
                  authMessage = result.message;
                }
                render();
                pollTimer = window.setTimeout(() => {
                  void poll(nextInterval);
                }, Math.max(5, nextInterval) * 1000);
              } catch (err) {
                shouldPoll = false;
                authMessage =
                  err instanceof Error ? err.message : "Authorization failed.";
                render();
              }
            };

            render();
            pollTimer = window.setTimeout(() => {
              void poll(auth.interval);
            }, auth.interval * 1000);
          } catch (err) {
            auth = null;
            shouldPoll = false;
            authMessage =
              err instanceof Error
                ? err.message
                : "Failed to start GitHub authorization.";
          } finally {
            isBusy = false;
            render();
          }
        });

      overlay
        .querySelector<HTMLElement>("[data-action=disconnect]")
        ?.addEventListener("click", async () => {
          if (isBusy) return;
          isBusy = true;
          stopPolling();

          try {
            await window.cvPilot.githubDisconnect();
            profile = null;
            repos = [];
            selectedRepoIds.clear();
            auth = null;
            authMessage = null;
          } catch (err) {
            window.alert(
              err instanceof Error ? err.message : "Disconnect failed"
            );
          } finally {
            isBusy = false;
            render();
          }
        });

      overlay
        .querySelector<HTMLElement>("[data-action=load-repos]")
        ?.addEventListener("click", async () => {
          if (isBusy) return;
          isBusy = true;

          try {
            repos = await window.cvPilot.githubListRepos({ includePrivate });
            // Default selection: top 5 by updatedAt/pushedAt order (API already sorted).
            selectedRepoIds.clear();
            repos.slice(0, 5).forEach((r) => selectedRepoIds.add(r.id));
          } catch (err) {
            window.alert(
              err instanceof Error ? err.message : "Failed to load repos"
            );
          } finally {
            isBusy = false;
            render();
          }
        });

      overlay
        .querySelector<HTMLElement>("[data-action=select-top]")
        ?.addEventListener("click", () => {
          selectedRepoIds.clear();
          filteredRepos.slice(0, 5).forEach((r) => selectedRepoIds.add(r.id));
          render();
        });

      overlay
        .querySelectorAll<HTMLInputElement>("[data-repo-id]")
        .forEach((checkbox) => {
          checkbox.addEventListener("change", () => {
            const id = Number(checkbox.getAttribute("data-repo-id"));
            if (!Number.isFinite(id)) return;
            if (checkbox.checked) {
              selectedRepoIds.add(id);
            } else {
              selectedRepoIds.delete(id);
            }
          });
        });

      overlay
        .querySelector<HTMLElement>("[data-action=apply]")
        ?.addEventListener("click", async () => {
          if (isBusy) return;
          if (!profile) return;

          const selected = repos.filter((r) => selectedRepoIds.has(r.id));
          if (selected.length === 0) return;

          isBusy = true;
          try {
            inlineMessage = null;
            applyStage = "readmes";

            readmeStatus = "Building repo context pack (README, topics, languages, structure)…";
            render();

            const pack = await window.cvPilot.githubBuildRepoContextPack({
              repos: selected,
              include: {
                topics: true,
                languages: true,
                tree: true,
                packageJson: true,
              },
            });

            if (pack.warnings && pack.warnings.length > 0) {
              inlineMessage = {
                kind: "info",
                text: "Some repo context was partially collected. This is usually fine.",
                details: pack.warnings,
              };
            }

            readmeStatus = `Repo context pack ready (${pack.repos.length} repo(s)).`;
            render();

            applyStage = "openai";
            render();

            const prevCv = getCv();
            const next = cloneCv(prevCv);

            // Basics
            if (!next.basics.fullName.trim()) {
              next.basics.fullName = (profile.name ?? profile.login).trim();
            }
            if (!next.basics.location.trim() && profile.location) {
              next.basics.location = profile.location;
            }

            const mergedLinks = uniqueNonEmptyLines([
              ...((next.basics.links ?? []).filter((l) => l.trim().length > 0)),
              safeUrl(profile.htmlUrl),
              safeUrl(profile.blog),
            ]);
            next.basics.links = mergedLinks.length > 0 ? mergedLinks : [""];

            // Projects
            const existingLinks = new Set(
              (next.projects ?? [])
                .map((p) => (p.link ?? "").trim())
                .filter((l) => l.length > 0)
            );

            // Require OpenAI config before applying; this keeps Apply behavior consistent.
            let openAiStatus: OpenAiStatus;
            try {
              openAiStatus = await window.cvPilot.openaiGetStatus();
            } catch (err) {
              const raw = err instanceof Error ? err.message : "Failed to load OpenAI settings.";
              inlineMessage = {
                kind: "error",
                text: raw.includes("No handler registered")
                  ? "OpenAI features require restarting the Electron app (stop `npm start` and run it again)."
                  : raw,
              };
              readmeStatus = null;
              applyStage = "idle";
              render();
              return;
            }
            if (!openAiStatus.storageAvailable) {
              inlineMessage = {
                kind: "error",
                text:
                  "OpenAI cannot be configured on this system because secure storage is unavailable.",
              };
              readmeStatus = null;
              applyStage = "idle";
              render();
              return;
            }
            if (!openAiStatus.configured) {
              inlineMessage = {
                kind: "error",
                text:
                  "OpenAI API key is missing. Click 'AI Settings' in the editor header to configure it, then try again.",
              };
              readmeStatus = null;
              applyStage = "idle";
              render();
              // Offer a direct jump.
              try {
                window.dispatchEvent(new Event("cvpilot:openai-settings"));
              } catch {
                // ignore
              }
              return;
            }

            const repoContext: OpenAiRepoContext[] = pack.repos;

            const ai = await window.cvPilot.openaiGenerateCvSuggestionsFromGitHub({
              repos: repoContext,
              existingProjectLinks: Array.from(existingLinks),
              existingSkills: [...(next.skills ?? [])],
              preferredName:
                next.basics.fullName.trim().length > 0
                  ? next.basics.fullName.trim()
                  : profile.name ?? profile.login,
            });

            const repoUrlByFullName = new Map(
              selected.map((r) => [r.fullName, r.htmlUrl] as const)
            );

            const existingProjects = [...(next.projects ?? [])];

            const upsertProject = (candidate: {
              title: string;
              date: string;
              link: string;
              highlights: string[];
            }) => {
              const link = (candidate.link ?? "").trim();
              if (!link) {
                return;
              }

              const idx = existingProjects.findIndex(
                (p) => (p.link ?? "").trim() === link
              );
              if (idx === -1) {
                existingProjects.push({
                  title: candidate.title,
                  date: candidate.date,
                  link,
                  highlights:
                    candidate.highlights.length > 0 ? candidate.highlights : [""],
                });
                existingLinks.add(link);
                return;
              }

              const currentHighlights = existingProjects[idx].highlights ?? [""];
              const isEmpty = currentHighlights.every((h) => (h ?? "").trim().length === 0);
              if (isEmpty && candidate.highlights.length > 0) {
                existingProjects[idx] = {
                  ...existingProjects[idx],
                  title: existingProjects[idx].title.trim().length > 0 ? existingProjects[idx].title : candidate.title,
                  date: existingProjects[idx].date.trim().length > 0 ? existingProjects[idx].date : candidate.date,
                  highlights: candidate.highlights,
                };
              }
            };

            // 1) Prefer AI suggestions.
            for (const suggestion of ai.projects ?? []) {
              const link =
                (suggestion.link ?? "").trim() ||
                repoUrlByFullName.get(suggestion.repoFullName) ||
                "";
              upsertProject({
                title: suggestion.title,
                date: suggestion.date,
                link,
                highlights: (suggestion.highlights ?? []).filter(
                  (h) => (h ?? "").trim().length > 0
                ),
              });
            }

            // 2) Ensure every selected repo becomes a project, even if the AI skipped it.
            for (const r of selected) {
              if (existingLinks.has(r.htmlUrl)) {
                continue;
              }
              const highlights: string[] = [];
              if (r.description) highlights.push(r.description);
              if (r.language) highlights.push(`Tech: ${r.language}`);
              upsertProject({
                title: r.name,
                date: formatRepoDate(r),
                link: r.htmlUrl,
                highlights,
              });
            }

            next.projects = existingProjects;
            if ((next.projects ?? []).length > 0) {
              next.sections.projects = true;
            }

            const existingSkillKeys = new Set(
              (next.skills ?? []).map((s) => normalizeSkillKey(s)).filter(Boolean)
            );

            const filtered = filterAiSkillsForCv(ai.skills ?? [], repoContext);
            const mergedSkills: string[] = [
              ...(next.skills ?? []).map((s) => s.trim()).filter(Boolean),
            ];
            for (const s of filtered.skills) {
              const key = normalizeSkillKey(s);
              if (!key) continue;
              if (existingSkillKeys.has(key)) continue;
              existingSkillKeys.add(key);
              mergedSkills.push(s);
            }
            next.skills = mergedSkills;

            setCv(next);
            try {
              onApplied?.(prevCv, next);
            } catch {
              // ignore
            }
            const notes = (ai.notes ?? []).map((n) => n.trim()).filter(Boolean);
            inlineMessage = {
              kind: "success",
              text: `Applied ${selected.length} repo(s) to your CV using OpenAI suggestions.`,
              details:
                [
                  ...notes,
                  ...(filtered.dropped > 0
                    ? [`Dropped ${filtered.dropped} vague/unverified skill(s) from AI output.`]
                    : []),
                  ...(pack.warnings ?? []),
                ]
                  .filter(Boolean)
                  .slice(0, 6).length > 0
                  ? [
                      ...notes,
                      ...(filtered.dropped > 0
                        ? [`Dropped ${filtered.dropped} vague/unverified skill(s) from AI output.`]
                        : []),
                      ...(pack.warnings ?? []),
                    ]
                      .filter(Boolean)
                      .slice(0, 6)
                  : undefined,
            };
            readmeStatus = null;
            applyStage = "idle";
            render();
          } catch (err) {
            inlineMessage = {
              kind: "error",
              text:
                err instanceof Error ? err.message : "Failed to apply GitHub import",
            };
            applyStage = "idle";
            render();
          } finally {
            isBusy = false;
            if (overlay.isConnected) {
              render();
            }
          }
        });
    };

    // Initial: attempt to detect existing connection.
    try {
      profile = await window.cvPilot.githubGetProfile();
    } catch {
      profile = null;
    }

    render();
  };

  importGithubButton.addEventListener("click", () => {
    void openGithubImportModal();
  });
}
