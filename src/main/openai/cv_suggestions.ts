import type {
  OpenAiCvSuggestions,
  OpenAiGenerateCvSuggestionsInput,
  OpenAiPackageJsonSummary,
  OpenAiRepoTreeSummary,
} from "../../shared/openai-types";

type JsonSchema = Record<string, unknown>;

function coerceStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter((v): v is string => typeof v === "string")
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
}

function normalizeLanguageBreakdown(value: unknown): Record<string, number> | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const entries: Array<[string, number]> = [];
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (typeof key !== "string" || key.trim().length === 0) continue;
    if (typeof raw !== "number" || !Number.isFinite(raw) || raw <= 0) continue;
    entries.push([key.trim(), raw]);
  }

  // Keep top 8 languages by bytes.
  entries.sort((a, b) => b[1] - a[1]);
  const top = entries.slice(0, 8);

  if (top.length === 0) return undefined;

  const out: Record<string, number> = {};
  for (const [k, v] of top) out[k] = v;
  return out;
}

function normalizeTreeSummary(value: unknown): OpenAiRepoTreeSummary | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const v = value as Record<string, unknown>;
  const topLevel = coerceStringArray(v.topLevel).slice(0, 30);
  const flags = coerceStringArray(v.flags).slice(0, 25);
  const truncated = v.truncated === true;

  const countsRaw = v.countsByExt;
  const countsEntries: Array<[string, number]> = [];
  if (countsRaw && typeof countsRaw === "object") {
    for (const [k, raw] of Object.entries(countsRaw as Record<string, unknown>)) {
      if (typeof k !== "string" || k.trim().length === 0) continue;
      if (typeof raw !== "number" || !Number.isFinite(raw) || raw <= 0) continue;
      countsEntries.push([k.trim().toLowerCase(), raw]);
    }
  }
  countsEntries.sort((a, b) => b[1] - a[1]);
  const topCounts = countsEntries.slice(0, 20);
  const countsByExt: Record<string, number> = {};
  for (const [k, n] of topCounts) countsByExt[k] = n;

  return {
    topLevel,
    countsByExt,
    flags,
    truncated,
  };
}

function normalizePackageJsonSummary(value: unknown): OpenAiPackageJsonSummary | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }
  const v = value as Record<string, unknown>;
  return {
    deps: coerceStringArray(v.deps).slice(0, 60),
    devDeps: coerceStringArray(v.devDeps).slice(0, 60),
    scripts: coerceStringArray(v.scripts).slice(0, 40),
  };
}

function extractOutputText(response: unknown): string | null {
  if (!response || typeof response !== "object") {
    return null;
  }

  const record = response as Record<string, unknown>;
  const output = record.output;
  if (!Array.isArray(output)) {
    return null;
  }

  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const it = item as Record<string, unknown>;
    if (it.type !== "message") continue;
    const content = it.content;
    if (!Array.isArray(content)) continue;

    for (const c of content) {
      if (!c || typeof c !== "object") continue;
      const cc = c as Record<string, unknown>;
      if (cc.type === "refusal" && typeof cc.refusal === "string") {
        throw new Error(cc.refusal);
      }
      if (cc.type === "output_text" && typeof cc.text === "string") {
        return cc.text;
      }
    }
  }

  return null;
}

function suggestionsSchema(): JsonSchema {
  return {
    type: "object",
    additionalProperties: false,
    required: ["projects", "skills", "notes"],
    properties: {
      projects: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["repoFullName", "title", "date", "link", "highlights"],
          properties: {
            repoFullName: { type: "string" },
            title: { type: "string" },
            date: { type: "string" },
            link: { type: "string" },
            highlights: {
              type: "array",
              items: { type: "string" },
            },
          },
        },
      },
      skills: {
        type: "array",
        items: { type: "string" },
      },
      notes: {
        type: "array",
        items: { type: "string" },
      },
    },
  };
}

function normalizeInput(input: OpenAiGenerateCvSuggestionsInput): OpenAiGenerateCvSuggestionsInput {
  const repos = (input.repos ?? []).slice(0, 12).map((r) => ({
    fullName: String(r.fullName ?? ""),
    htmlUrl: String(r.htmlUrl ?? ""),
    description: r.description ?? null,
    language: r.language ?? null,
    topics: coerceStringArray(r.topics).slice(0, 20),
    languages: normalizeLanguageBreakdown(r.languages),
    treeSummary: normalizeTreeSummary(r.treeSummary),
    packageJson: normalizePackageJsonSummary(r.packageJson),
    updatedAt: String(r.updatedAt ?? ""),
    pushedAt: r.pushedAt ?? null,
    readmeText:
      typeof r.readmeText === "string"
        ? r.readmeText.slice(0, 12_000)
        : null,
    readmeTruncated: !!r.readmeTruncated,
  }));

  return {
    repos,
    existingProjectLinks: coerceStringArray(input.existingProjectLinks),
    existingSkills: coerceStringArray(input.existingSkills),
    preferredName:
      typeof input.preferredName === "string" && input.preferredName.trim().length > 0
        ? input.preferredName.trim()
        : null,
  };
}

export async function generateCvSuggestionsFromGitHubContext(
  apiKey: string,
  model: string,
  input: OpenAiGenerateCvSuggestionsInput
): Promise<OpenAiCvSuggestions> {
  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error("OpenAI API key is not configured.");
  }

  const normalized = normalizeInput(input);

  const system =
    "You are a CV assistant. Use the provided GitHub repository context to propose CV-ready project entries and relevant skills. " +
    "Return ONLY valid JSON that matches the provided JSON schema. " +
    "Keep content concise and factual; do not invent details not supported by the provided context.";

  const userPayload = {
    instructions: {
      output_style: {
        projects: {
          highlights: "3-5 bullets, each <= 110 chars, action-oriented, no emojis",
          date: "Prefer year based on pushedAt/updatedAt",
        },
        skills:
          "Return 8-14 concrete, ATS-searchable technical keywords (languages, frameworks, tools, platforms). " +
          "Avoid vague phrases (e.g., 'software development', 'repository maintenance', 'configuration management', 'secure local storage'). " +
          "Prefer skill names supported by the repo context (languages/topics/dependencies/tree flags). " +
          "Use common spellings (TypeScript, Node.js, Electron, Docker, GitHub Actions, PostgreSQL).",
      },
      constraints: {
        avoid_existing_project_links: normalized.existingProjectLinks,
        avoid_duplicate_skills: normalized.existingSkills,
        candidate_name: normalized.preferredName,
      },
    },
    repos: normalized.repos,
  };

  const body = {
    model: model && model.trim().length > 0 ? model.trim() : "gpt-4o-mini",
    input: [
      { role: "system", content: system },
      {
        role: "user",
        content:
          "Generate CV suggestions from this JSON context:\n" +
          JSON.stringify(userPayload),
      },
    ],
    max_output_tokens: 1200,
    text: {
      format: {
        type: "json_schema",
        name: "cv_suggestions",
        strict: true,
        schema: suggestionsSchema(),
      },
    },
  };

  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  const rawText = await res.text();
  let json: unknown;
  try {
    json = JSON.parse(rawText) as unknown;
  } catch {
    throw new Error(`OpenAI returned non-JSON (${res.status}).`);
  }

  if (!res.ok) {
    const record = json && typeof json === "object" ? (json as Record<string, unknown>) : null;
    const err = record?.error && typeof record.error === "object" ? (record.error as Record<string, unknown>) : null;
    const message = typeof err?.message === "string" ? err.message : null;
    throw new Error(message ? `OpenAI error: ${message}` : `OpenAI request failed (${res.status}).`);
  }

  const outputText = extractOutputText(json);
  if (!outputText) {
    throw new Error("OpenAI response did not contain output text.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(outputText) as unknown;
  } catch {
    throw new Error("OpenAI returned invalid JSON output.");
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("OpenAI returned unexpected output shape.");
  }

  const record = parsed as Record<string, unknown>;
  const projects = Array.isArray(record.projects) ? record.projects : [];
  const skills = Array.isArray(record.skills) ? record.skills : [];
  const notes = Array.isArray(record.notes) ? record.notes : [];

  // Light normalization to protect downstream code.
  const normalizedResult: OpenAiCvSuggestions = {
    projects: projects
      .map((p) => {
        if (!p || typeof p !== "object") return null;
        const pr = p as Record<string, unknown>;
        const highlightsRaw = Array.isArray(pr.highlights) ? pr.highlights : [];
        const highlights = highlightsRaw
          .filter((h): h is string => typeof h === "string")
          .map((h) => h.trim())
          .filter((h) => h.length > 0);

        return {
          repoFullName: typeof pr.repoFullName === "string" ? pr.repoFullName : "",
          title: typeof pr.title === "string" ? pr.title : "",
          date: typeof pr.date === "string" ? pr.date : "",
          link: typeof pr.link === "string" ? pr.link : "",
          highlights,
        };
      })
      .filter((p): p is OpenAiCvSuggestions["projects"][number] => p !== null),
    skills: skills.filter((s): s is string => typeof s === "string").map((s) => s.trim()).filter((s) => s.length > 0),
    notes: notes.filter((n): n is string => typeof n === "string").map((n) => n.trim()).filter((n) => n.length > 0),
  };

  return normalizedResult;
}
