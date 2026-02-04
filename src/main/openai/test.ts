import type { OpenAiTestResult } from "../../shared/openai-types";

type JsonSchema = Record<string, unknown>;

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

function testSchema(): JsonSchema {
  return {
    type: "object",
    additionalProperties: false,
    required: ["ok", "message"],
    properties: {
      ok: { type: "boolean" },
      message: { type: "string" },
    },
  };
}

export async function testOpenAi(apiKey: string, model: string): Promise<OpenAiTestResult> {
  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error("OpenAI API key is not configured.");
  }

  const chosenModel = model && model.trim().length > 0 ? model.trim() : "gpt-4o-mini";

  const body = {
    model: chosenModel,
    input: [
      {
        role: "system",
        content:
          "You are a connectivity test. Return ONLY JSON that matches the schema. Set ok=true if you can comply.",
      },
      {
        role: "user",
        content:
          "Return a short confirmation JSON. message should be <= 60 chars and mention Structured Outputs.",
      },
    ],
    max_output_tokens: 200,
    text: {
      format: {
        type: "json_schema",
        name: "openai_test",
        strict: true,
        schema: testSchema(),
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

  const responseRecord = json && typeof json === "object" ? (json as Record<string, unknown>) : null;
  const apiModel = responseRecord && typeof responseRecord.model === "string" ? responseRecord.model : null;

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
  const ok = record.ok === true;
  const returnedModel = apiModel || chosenModel;
  const message = typeof record.message === "string" ? record.message : "";

  return {
    ok,
    model: returnedModel,
    message,
  };
}
