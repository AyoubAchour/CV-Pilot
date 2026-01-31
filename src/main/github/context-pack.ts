import type { GitHubRepoSummary } from "../../shared/github-types";
import type {
  OpenAiPackageJsonSummary,
  OpenAiRepoContext,
  OpenAiRepoTreeSummary,
} from "../../shared/openai-types";
import type { RepoContextPackInclude } from "../../shared/repo-context-pack";

import {
  githubGetRepoFileRaw,
  githubGetRepoLanguages,
  githubGetRepoReadme,
  githubGetRepoTopics,
  githubGetRepoTree,
} from "./client";

type ContextPackResult = {
  repos: OpenAiRepoContext[];
  warnings: string[];
};

function asNonEmptyString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function mapLimit<T, R>(
  items: readonly T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const concurrency = Math.max(1, Math.floor(limit));
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  const runOne = async (): Promise<void> => {
    while (nextIndex < items.length) {
      const idx = nextIndex;
      nextIndex += 1;
      results[idx] = await worker(items[idx], idx);
    }
  };

  const runners = Array.from({ length: Math.min(concurrency, items.length) }, () => runOne());
  return Promise.all(runners).then(() => results);
}

function coerceStringArray(value: unknown, max: number): string[] {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  for (const v of value) {
    if (typeof v !== "string") continue;
    const trimmed = v.trim();
    if (!trimmed) continue;
    out.push(trimmed);
    if (out.length >= max) break;
  }
  return out;
}

function buildTreeSummary(
  shallowPaths: string[],
  deepPaths: string[] | null,
  deepTruncated: boolean
): OpenAiRepoTreeSummary {
  const MAX_TOP = 60;
  const MAX_FLAGS = 30;
  const MAX_DEEP_COUNT = 5000;
  const MAX_EXTS = 20;

  const topLevel = Array.from(
    new Set(
      shallowPaths
        .map((p) => p.split("/")[0] || "")
        .map((p) => p.trim())
        .filter(Boolean)
    )
  ).slice(0, MAX_TOP);

  const countsByExt: Record<string, number> = {};
  const flags = new Set<string>();

  const candidates = deepPaths ? deepPaths.slice(0, MAX_DEEP_COUNT) : shallowPaths;

  for (const p of candidates) {
    const lower = p.toLowerCase();

    if (lower === "package.json" || lower.endsWith("/package.json")) flags.add("has:package.json");
    if (lower === "pnpm-lock.yaml" || lower.endsWith("/pnpm-lock.yaml")) flags.add("has:pnpm");
    if (lower === "yarn.lock" || lower.endsWith("/yarn.lock")) flags.add("has:yarn");
    if (lower === "package-lock.json" || lower.endsWith("/package-lock.json")) flags.add("has:npm");
    if (lower === "tsconfig.json" || lower.endsWith("/tsconfig.json")) flags.add("has:typescript");
    if (lower === "vite.config.ts" || lower === "vite.config.js" || lower.includes("vite.")) flags.add("has:vite");
    if (lower === "next.config.js" || lower === "next.config.mjs" || lower === "next.config.ts") flags.add("has:nextjs");
    if (lower === "dockerfile" || lower.endsWith("/dockerfile")) flags.add("has:docker");
    if (lower.startsWith(".github/workflows/") || lower.includes("/.github/workflows/")) flags.add("has:github-actions");
    if (lower.endsWith(".tf") || lower.includes("/terraform")) flags.add("has:terraform");
    if (lower.endsWith(".py")) flags.add("has:python");
    if (lower.endsWith(".rs")) flags.add("has:rust");
    if (lower.endsWith(".go")) flags.add("has:go");

    const base = p.split("/").pop() ?? "";
    const dot = base.lastIndexOf(".");
    if (dot > 0 && dot < base.length - 1) {
      const ext = base.slice(dot + 1).toLowerCase();
      if (ext.length <= 8) {
        countsByExt[ext] = (countsByExt[ext] ?? 0) + 1;
      }
    }
  }

  // Reduce size: keep only the most frequent extensions.
  const extEntries = Object.entries(countsByExt).sort((a, b) => b[1] - a[1]);
  const topExtEntries = extEntries.slice(0, MAX_EXTS);
  const reducedCountsByExt: Record<string, number> = {};
  for (const [ext, count] of topExtEntries) {
    reducedCountsByExt[ext] = count;
  }

  const flagsArray = Array.from(flags).slice(0, MAX_FLAGS);

  return {
    topLevel,
    countsByExt: reducedCountsByExt,
    flags: flagsArray,
    truncated: deepTruncated || (deepPaths ? deepPaths.length > MAX_DEEP_COUNT : false),
  };
}

function redactSensitiveText(text: string): { text: string; warnings: string[] } {
  const warnings: string[] = [];

  const patterns: Array<{ name: string; regex: RegExp }> = [
    { name: "private key", regex: /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g },
    { name: "AWS access key", regex: /AKIA[0-9A-Z]{16}/g },
    { name: "GitHub token", regex: /ghp_[A-Za-z0-9]{30,}/g },
    { name: "OpenAI key", regex: /\bsk-[A-Za-z0-9]{20,}\b/g },
    { name: "generic secret assignment", regex: /(api[_-]?key|secret|token|password)\s*[:=]\s*['"]?[^'"\n]{8,}['"]?/gi },
  ];

  let out = text;
  for (const p of patterns) {
    const before = out;
    out = out.replace(p.regex, "[REDACTED]");
    if (out !== before) {
      warnings.push(`Redacted potential ${p.name} from README.`);
    }
  }

  return { text: out, warnings };
}

function summarizePackageJson(raw: string): OpenAiPackageJsonSummary | null {
  if (raw.length > 200_000) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== "object") {
    return null;
  }

  const record = parsed as Record<string, unknown>;

  const deps = record.dependencies && typeof record.dependencies === "object" ? Object.keys(record.dependencies as Record<string, unknown>) : [];
  const devDeps = record.devDependencies && typeof record.devDependencies === "object" ? Object.keys(record.devDependencies as Record<string, unknown>) : [];
  const scripts = record.scripts && typeof record.scripts === "object" ? Object.keys(record.scripts as Record<string, unknown>) : [];

  const uniq = (arr: string[]) => Array.from(new Set(arr.map((s) => s.trim()).filter(Boolean))).slice(0, 80);

  return {
    deps: uniq(deps),
    devDeps: uniq(devDeps),
    scripts: uniq(scripts),
  };
}

export async function buildGitHubRepoContextPack(
  token: string,
  repos: GitHubRepoSummary[],
  include: RepoContextPackInclude | undefined
): Promise<ContextPackResult> {
  const warnings: string[] = [];

  const effective: Required<RepoContextPackInclude> = {
    topics: include?.topics !== false,
    languages: include?.languages !== false,
    tree: include?.tree !== false,
    packageJson: include?.packageJson !== false,
  };

  const sanitized = (Array.isArray(repos) ? repos : [])
    .filter((r): r is GitHubRepoSummary => !!r && typeof r === "object")
    .slice(0, 12);

  const resultRepos = await mapLimit(sanitized, 3, async (repo) => {
    const owner = asNonEmptyString(repo.owner) ?? "";
    const name = asNonEmptyString(repo.name) ?? "";
    const fullName = asNonEmptyString(repo.fullName) ?? (owner && name ? `${owner}/${name}` : "");
    const htmlUrl = asNonEmptyString(repo.htmlUrl) ?? "";
    const defaultBranch = asNonEmptyString(repo.defaultBranch) ?? "main";

    const base: OpenAiRepoContext = {
      fullName,
      htmlUrl,
      description: repo.description ?? null,
      language: repo.language ?? null,
      updatedAt: String(repo.updatedAt ?? ""),
      pushedAt: repo.pushedAt ?? null,
      readmeText: null,
      readmeTruncated: false,
    };

    if (!owner || !name) {
      warnings.push(`Skipped invalid repo entry (${fullName || "unknown"}).`);
      return base;
    }

    // Fetch README (always, since current system relies on it heavily)
    try {
      const readme = await githubGetRepoReadme(token, owner, name);
      if (typeof readme.text === "string") {
        const redacted = redactSensitiveText(readme.text);
        base.readmeText = redacted.text;
        base.readmeTruncated = !!readme.truncated;
        warnings.push(...redacted.warnings.map((w) => `${fullName}: ${w}`));
      } else {
        base.readmeText = null;
        base.readmeTruncated = false;
      }
    } catch (err) {
      warnings.push(
        `${fullName}: README fetch failed (${err instanceof Error ? err.message : "unknown error"}).`
      );
    }

    if (effective.topics) {
      try {
        const topics = await githubGetRepoTopics(token, owner, name);
        base.topics = coerceStringArray(topics, 20);
      } catch (err) {
        warnings.push(
          `${fullName}: topics fetch failed (${err instanceof Error ? err.message : "unknown error"}).`
        );
      }
    }

    if (effective.languages) {
      try {
        base.languages = await githubGetRepoLanguages(token, owner, name);
      } catch (err) {
        warnings.push(
          `${fullName}: languages fetch failed (${err instanceof Error ? err.message : "unknown error"}).`
        );
      }
    }

    if (effective.tree) {
      try {
        const shallow = await githubGetRepoTree(token, owner, name, defaultBranch, false);
        const shallowPaths = shallow.tree
          .map((e) => (typeof e?.path === "string" ? e.path : ""))
          .filter(Boolean);

        let deepPaths: string[] | null = null;
        let deepTruncated = shallow.truncated;

        try {
          const deep = await githubGetRepoTree(token, owner, name, defaultBranch, true);
          deepTruncated = deepTruncated || deep.truncated;
          deepPaths = deep.tree
            .map((e) => (typeof e?.path === "string" ? e.path : ""))
            .filter(Boolean);
        } catch {
          // Ignore deep fetch failures and fall back to shallow tree summary.
          deepPaths = null;
        }

        base.treeSummary = buildTreeSummary(shallowPaths, deepPaths, deepTruncated);
      } catch (err) {
        warnings.push(
          `${fullName}: tree summary fetch failed (${err instanceof Error ? err.message : "unknown error"}).`
        );
      }
    }

    if (effective.packageJson) {
      try {
        const raw = await githubGetRepoFileRaw(token, owner, name, "package.json", defaultBranch);
        if (typeof raw === "string" && raw.trim().length > 0) {
          const summary = summarizePackageJson(raw);
          if (summary) {
            base.packageJson = summary;
          }
        }
      } catch (err) {
        // Optional; do not fail the pack.
        warnings.push(
          `${fullName}: package.json fetch failed (${err instanceof Error ? err.message : "unknown error"}).`
        );
      }
    }

    return base;
  });

  return {
    repos: resultRepos,
    warnings: warnings.slice(0, 50),
  };
}
