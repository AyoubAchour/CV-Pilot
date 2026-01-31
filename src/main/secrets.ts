import { app, safeStorage } from "electron";
import path from "node:path";
import fs from "node:fs/promises";

type SecretsRecord = {
  githubToken?: string; // base64-encoded encrypted buffer
  openaiApiKey?: string; // base64-encoded encrypted buffer
  openaiModel?: string; // plain string (not secret)
};

function getSecretsFilePath(): string {
  return path.join(app.getPath("userData"), "secrets.json");
}

async function readSecrets(): Promise<SecretsRecord> {
  try {
    const raw = await fs.readFile(getSecretsFilePath(), "utf8");
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return {};
    }
    const record = parsed as Record<string, unknown>;
    const githubToken =
      typeof record.githubToken === "string" ? record.githubToken : undefined;
    const openaiApiKey =
      typeof record.openaiApiKey === "string" ? record.openaiApiKey : undefined;
    const openaiModel =
      typeof record.openaiModel === "string" ? record.openaiModel : undefined;
    return { githubToken, openaiApiKey, openaiModel };
  } catch {
    return {};
  }
}

async function writeSecrets(secrets: SecretsRecord): Promise<void> {
  await fs.mkdir(app.getPath("userData"), { recursive: true });
  await fs.writeFile(getSecretsFilePath(), JSON.stringify(secrets, null, 2), "utf8");
}

export async function getStoredGitHubToken(): Promise<string | null> {
  const secrets = await readSecrets();
  if (!secrets.githubToken) {
    return null;
  }

  if (!safeStorage.isEncryptionAvailable()) {
    return null;
  }

  const encrypted = Buffer.from(secrets.githubToken, "base64");
  try {
    return safeStorage.decryptString(encrypted);
  } catch {
    return null;
  }
}

export async function setStoredGitHubToken(token: string | null): Promise<void> {
  const secrets = await readSecrets();
  if (!token) {
    delete secrets.githubToken;
    await writeSecrets(secrets);
    return;
  }

  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error("Secure storage is not available on this system yet.");
  }

  const encrypted = safeStorage.encryptString(token);
  secrets.githubToken = encrypted.toString("base64");
  await writeSecrets(secrets);
}

export async function getStoredOpenAiApiKey(): Promise<string | null> {
  const secrets = await readSecrets();
  if (!secrets.openaiApiKey) {
    return null;
  }

  if (!safeStorage.isEncryptionAvailable()) {
    return null;
  }

  const encrypted = Buffer.from(secrets.openaiApiKey, "base64");
  try {
    return safeStorage.decryptString(encrypted);
  } catch {
    return null;
  }
}

export async function setStoredOpenAiApiKey(apiKey: string | null): Promise<void> {
  const secrets = await readSecrets();
  if (!apiKey) {
    delete secrets.openaiApiKey;
    await writeSecrets(secrets);
    return;
  }

  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error("Secure storage is not available on this system yet.");
  }

  const encrypted = safeStorage.encryptString(apiKey);
  secrets.openaiApiKey = encrypted.toString("base64");
  await writeSecrets(secrets);
}

export async function getStoredOpenAiModel(): Promise<string | null> {
  const secrets = await readSecrets();
  const model = typeof secrets.openaiModel === "string" ? secrets.openaiModel : "";
  return model.trim().length > 0 ? model.trim() : null;
}

export async function setStoredOpenAiModel(model: string | null): Promise<void> {
  const secrets = await readSecrets();
  if (!model || model.trim().length === 0) {
    delete secrets.openaiModel;
    await writeSecrets(secrets);
    return;
  }

  secrets.openaiModel = model.trim();
  await writeSecrets(secrets);
}
