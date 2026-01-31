import type {
  OpenAiGenerateSummaryFromCvInput,
  OpenAiGenerateSummaryFromCvResult,
} from "../../shared/openai-types";

type JsonSchema = Record<string, unknown>;

function coerceString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function coerceStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter((v): v is string => typeof v === "string")
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
}

function normalizeLines(lines: string[], maxItems: number, maxLen: number): string[] {
  const out: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    out.push(trimmed.slice(0, maxLen));
    if (out.length >= maxItems) break;
  }
  return out;
}

function normalizeInput(
  input: OpenAiGenerateSummaryFromCvInput
): OpenAiGenerateSummaryFromCvInput {
  const headline = (input.headline ?? "").trim();

  return {
    headline: headline.length > 0 ? headline : null,
    skills: normalizeLines(input.skills ?? [], 18, 60),
    experience: (input.experience ?? []).slice(0, 6).map((e) => ({
      role: coerceString(e.role).trim().slice(0, 80),
      company: coerceString(e.company).trim().slice(0, 80),
      highlights: normalizeLines(coerceStringArray(e.highlights), 4, 160),
    })),
    projects: (input.projects ?? []).slice(0, 6).map((p) => ({
      title: coerceString(p.title).trim().slice(0, 90),
      highlights: normalizeLines(coerceStringArray(p.highlights), 4, 160),
    })),
    education: (input.education ?? []).slice(0, 3).map((ed) => ({
      school: coerceString(ed.school).trim().slice(0, 100),
      degree: coerceString(ed.degree).trim().slice(0, 100),
    })),
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

function summarySchema(): JsonSchema {
  return {
    type: "object",
    additionalProperties: false,
    required: ["summary", "notes"],
    properties: {
      summary: { type: "string" },
      notes: {
        type: "array",
        items: { type: "string" },
      },
    },
  };
}

function truncateWords(value: string, maxWords: number): string {
  const words = value
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .filter(Boolean);
  if (words.length <= maxWords) return words.join(" ");
  return words.slice(0, maxWords).join(" ");
}

export async function generateSummaryFromCvContext(
  apiKey: string,
  model: string,
  input: OpenAiGenerateSummaryFromCvInput
): Promise<OpenAiGenerateSummaryFromCvResult> {
  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error("OpenAI API key is not configured.");
  }

  const normalized = normalizeInput(input);

  const system =
    "You are a resume writer. Draft a Professional Summary (aka resume summary) that markets the candidate, not their projects. " +
    "Use ONLY facts from the provided CV context; do not invent, assume, or exaggerate. " +
    "No personal pronouns (I, me, my). No name or contact info. " +
    "2-4 sentences, plain text, professional tone, no emojis. " +
    "Start with the target job title if provided. Then summarize specialization, strengths, and the kind of value delivered. " +
    "Avoid sounding like a changelog: do NOT list many tools/frameworks/vendors, do NOT name model providers, and do NOT mention build tooling (e.g., packaging, Electron Forge, Vite). " +
    "If projects are the only evidence, refer to them at a high level (e.g., 'developer tools', 'cross-platform desktop apps') in at most ONE sentence. " +
    "Prefer outcomes/impact and scope when present; if there are no metrics, do not add numbers. " +
    "Avoid keyword stuffing and avoid unnecessary specificity.";

  const userPayload = {
    targetTitle: normalized.headline,
    skills: normalized.skills,
    experience: normalized.experience,
    projects: normalized.projects,
    education: normalized.education,
  };

  const body = {
    model: model && model.trim().length > 0 ? model.trim() : "gpt-4o-mini",
    input: [
      { role: "system", content: system },
      {
        role: "user",
        content:
          "Generate a professional summary from this CV JSON context:\n" +
          JSON.stringify(userPayload) +
          "\n\nOutput guidance: " +
          "- Emphasize role fit, strengths, and value proposition (what the candidate is good at). " +
          "- Mention at most 2-4 core technologies total, and only if they help positioning. " +
          "- Prefer concrete impact from highlights; do not restate every project detail. " +
          "- If there are no metrics, do not add numbers. " +
          "- Keep it under ~70 words.",
      },
    ],
    max_output_tokens: 400,
    text: {
      format: {
        type: "json_schema",
        name: "cv_summary",
        strict: true,
        schema: summarySchema(),
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
    const err =
      record?.error && typeof record.error === "object"
        ? (record.error as Record<string, unknown>)
        : null;
    const message = typeof err?.message === "string" ? err.message : "";
    throw new Error(
      message ? `OpenAI error: ${message}` : `OpenAI request failed (${res.status}).`
    );
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
  const summaryRaw = typeof record.summary === "string" ? record.summary : "";
  const notes = coerceStringArray(record.notes);

  const summary = truncateWords(summaryRaw, 90);

  return {
    summary,
    notes: notes.slice(0, 6),
  };
}
