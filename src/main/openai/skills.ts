import type {
  OpenAiGenerateSkillsFromCvInput,
  OpenAiGenerateSkillsFromCvResult,
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
  input: OpenAiGenerateSkillsFromCvInput
): OpenAiGenerateSkillsFromCvInput {
  const headline = (input.headline ?? "").trim();

  return {
    headline: headline.length > 0 ? headline : null,
    existingSkills: normalizeLines(input.existingSkills ?? [], 40, 60),
    experience: (input.experience ?? []).slice(0, 6).map((e) => ({
      role: coerceString(e.role).trim().slice(0, 80),
      company: coerceString(e.company).trim().slice(0, 80),
      highlights: normalizeLines(coerceStringArray(e.highlights), 4, 180),
    })),
    projects: (input.projects ?? []).slice(0, 6).map((p) => ({
      title: coerceString(p.title).trim().slice(0, 90),
      highlights: normalizeLines(coerceStringArray(p.highlights), 4, 180),
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

function skillsSchema(): JsonSchema {
  return {
    type: "object",
    additionalProperties: false,
    required: ["skills", "notes"],
    properties: {
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

export async function generateSkillsFromCvContext(
  apiKey: string,
  model: string,
  input: OpenAiGenerateSkillsFromCvInput
): Promise<OpenAiGenerateSkillsFromCvResult> {
  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error("OpenAI API key is not configured.");
  }

  const normalized = normalizeInput(input);

  const system =
    "You are an ATS resume expert. Propose a concise list of technical skills for the candidate. " +
    "Use ONLY evidence present in the provided CV context (role/company/highlights/projects/education). " +
    "Return only concrete, ATS-searchable keywords (tools, languages, frameworks, platforms, methodologies). " +
    "Do NOT include soft skills (e.g., communication), vague phrases (e.g., software development), or long sentences. " +
    "Avoid duplicates and avoid items already in existingSkills.";

  const userPayload = {
    targetTitle: normalized.headline,
    existingSkills: normalized.existingSkills,
    experience: normalized.experience,
    projects: normalized.projects,
    education: normalized.education,
    output: {
      count: "10-16 items",
      style: "Each item should be a short skill name (2-40 chars), no emojis, no punctuation lists.",
      examples: ["TypeScript", "Node.js", "Electron", "GitHub Actions"],
    },
  };

  const body = {
    model: model && model.trim().length > 0 ? model.trim() : "gpt-4o-mini",
    input: [
      { role: "system", content: system },
      {
        role: "user",
        content:
          "Generate skills suggestions from this CV JSON context:\n" +
          JSON.stringify(userPayload),
      },
    ],
    max_output_tokens: 550,
    text: {
      format: {
        type: "json_schema",
        name: "cv_skills",
        strict: true,
        schema: skillsSchema(),
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
  const skills = coerceStringArray(record.skills).slice(0, 20);
  const notes = coerceStringArray(record.notes).slice(0, 8);

  return {
    skills,
    notes,
  };
}

