import { app, BrowserWindow, dialog, ipcMain, safeStorage, shell } from "electron";
import path from "node:path";
import fs from "node:fs/promises";

import type {
  GitHubAuthBeginInput,
  GitHubAuthBeginResult,
  GitHubAuthPollInput,
  GitHubAuthPollResult,
  GitHubReadmeResult,
  GitHubRepoSummary,
  GitHubUserProfile,
} from "../../shared/github-types";

import type {
  GitHubBuildRepoContextPackInput,
  GitHubBuildRepoContextPackResult,
} from "../../shared/repo-context-pack";

import { getCvSuggestedFileName, renderCvHtmlDocument } from "../../shared/cv-template";
import { normalizeCvDocument } from "../../shared/cv-model";

import {
  createBlankCvProject,
  getProjectCv,
  listProjects,
  saveProjectCv,
  type CreateBlankCvProjectResult,
  type ProjectSummary,
  type SaveProjectCvInput,
} from "../projects";

import { createPdfFromHtml } from "../pdf";

import {
  getStoredGitHubToken,
  getStoredOpenAiApiKey,
  getStoredOpenAiModel,
  setStoredGitHubToken,
  setStoredOpenAiApiKey,
  setStoredOpenAiModel,
} from "../secrets";
import { githubGetProfile, githubGetRepoReadme, githubListRepos } from "../github/client";
import { isSafeGitHubVerificationUri } from "../github/config";
import { GitHubDeviceFlowService } from "../github/device-flow";
import { buildGitHubRepoContextPack } from "../github/context-pack";
import { generateCvSuggestionsFromGitHubContext } from "../openai/cv_suggestions";
import { generateSkillsFromCvContext } from "../openai/skills";
import { generateSummaryFromCvContext } from "../openai/summary";
import { testOpenAi } from "../openai/test";
import type {
  OpenAiCvSuggestions,
  OpenAiGenerateCvSuggestionsInput,
  OpenAiGenerateSkillsFromCvInput,
  OpenAiGenerateSkillsFromCvResult,
  OpenAiGenerateSummaryFromCvInput,
  OpenAiGenerateSummaryFromCvResult,
  OpenAiStatus,
  OpenAiTestResult,
} from "../../shared/openai-types";

type ExportCvPdfInput = {
  projectId: string;
  cv: unknown;
  suggestedFileName?: string;
};

type ExportCvPdfResult =
  | { canceled: true }
  | {
      canceled: false;
      savedPath: string;
    };

export function registerIpcHandlers(): void {
  const deviceFlow = new GitHubDeviceFlowService();

  ipcMain.handle("cv:listProjects", async (): Promise<ProjectSummary[]> => {
    return listProjects();
  });

  ipcMain.handle(
    "cv:createBlankCvProject",
    async (): Promise<CreateBlankCvProjectResult> => {
      return createBlankCvProject();
    }
  );

  ipcMain.handle(
    "cv:getProjectCv",
    async (_event, projectId: string) => {
      return getProjectCv(projectId);
    }
  );

  ipcMain.handle("cv:saveProjectCv", async (_event, input: SaveProjectCvInput) => {
    return saveProjectCv(input);
  });

  ipcMain.handle(
    "cv:exportCvPdf",
    async (_event, input: ExportCvPdfInput): Promise<ExportCvPdfResult> => {
      if (!input || typeof input.projectId !== "string" || !input.cv) {
        throw new Error("Invalid payload");
      }

      const parentWindow =
        BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0] ?? null;

      const cv = normalizeCvDocument(input.cv);

      const suggestedFileName =
        typeof input.suggestedFileName === "string" &&
        input.suggestedFileName.trim().length > 0
          ? input.suggestedFileName
          : getCvSuggestedFileName(cv);

      const saveResult = await dialog.showSaveDialog(parentWindow, {
        title: "Export CV as PDF",
        defaultPath: path.join(app.getPath("documents"), suggestedFileName),
        filters: [{ name: "PDF", extensions: ["pdf"] }],
      });

      if (saveResult.canceled || !saveResult.filePath) {
        return { canceled: true };
      }

      const html = renderCvHtmlDocument(cv);
      const pdfBuffer = await createPdfFromHtml(html);
      await fs.writeFile(saveResult.filePath, pdfBuffer);

      return { canceled: false, savedPath: saveResult.filePath };
    }
  );

  ipcMain.handle("cv:githubDisconnect", async (): Promise<void> => {
    await setStoredGitHubToken(null);
  });

  ipcMain.handle(
    "cv:githubBeginAuth",
    async (_event, input: GitHubAuthBeginInput | undefined): Promise<GitHubAuthBeginResult> => {
      const includePrivate = !!input?.includePrivate;
      const result = await deviceFlow.beginAuth(includePrivate);

      // Open the browser for convenience.
      if (isSafeGitHubVerificationUri(result.verificationUri)) {
        try {
          await shell.openExternal(result.verificationUri);
        } catch {
          // ignore
        }
      }

      return result;
    }
  );

  ipcMain.handle(
    "cv:githubPollAuth",
    async (_event, input: GitHubAuthPollInput | undefined): Promise<GitHubAuthPollResult> => {
      const sessionId = typeof input?.sessionId === "string" ? input.sessionId : "";
      const result = await deviceFlow.pollAuth(sessionId);

      if (result.status === "authorized") {
        const token = result.accessToken;
        if (!token) {
          return { status: "error", message: "Authorization completed but no token was returned." };
        }

        try {
          await setStoredGitHubToken(token);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Failed to store token.";
          return { status: "error", message };
        }

        return { status: "authorized" };
      }

      // For non-authorized statuses, forward as-is.
      return {
        status: result.status,
        interval: result.interval,
        message: result.message,
      };
    }
  );

  ipcMain.handle("cv:githubGetProfile", async (): Promise<GitHubUserProfile> => {
    const token = await getStoredGitHubToken();
    if (!token) {
      throw new Error("GitHub is not connected.");
    }
    return githubGetProfile(token);
  });

  ipcMain.handle(
    "cv:githubListRepos",
    async (_event, input: { includePrivate?: boolean } | undefined): Promise<GitHubRepoSummary[]> => {
      const token = await getStoredGitHubToken();
      if (!token) {
        throw new Error("GitHub is not connected.");
      }
      return githubListRepos(token, !!input?.includePrivate);
    }
  );

  ipcMain.handle(
    "cv:githubBuildRepoContextPack",
    async (
      _event,
      input: GitHubBuildRepoContextPackInput | undefined
    ): Promise<GitHubBuildRepoContextPackResult> => {
      const token = await getStoredGitHubToken();
      if (!token) {
        throw new Error("GitHub is not connected.");
      }
      const repos = Array.isArray(input?.repos) ? input.repos : [];
      return buildGitHubRepoContextPack(token, repos, input?.include);
    }
  );

  ipcMain.handle(
    "cv:githubGetReadme",
    async (
      _event,
      input: { owner: string; repo: string } | undefined
    ): Promise<GitHubReadmeResult> => {
      const token = await getStoredGitHubToken();
      if (!token) {
        throw new Error("GitHub is not connected.");
      }
      const owner = typeof input?.owner === "string" ? input.owner : "";
      const repo = typeof input?.repo === "string" ? input.repo : "";
      if (!owner || !repo) {
        throw new Error("Invalid repo payload.");
      }
      return githubGetRepoReadme(token, owner, repo);
    }
  );

  ipcMain.handle("cv:openaiGetStatus", async (): Promise<OpenAiStatus> => {
    const model = (await getStoredOpenAiModel()) ?? "gpt-4o-mini";
    const apiKey = await getStoredOpenAiApiKey();

    // Match the storage behavior of other secrets: if encryption isn't available,
    // we cannot securely store the key.
    const storageAvailable = safeStorage.isEncryptionAvailable();

    return {
      configured: !!apiKey,
      storageAvailable,
      model,
    };
  });

  ipcMain.handle(
    "cv:openaiSetConfig",
    async (
      _event,
      input: { apiKey?: string; model?: string } | undefined
    ): Promise<void> => {
      const apiKey = typeof input?.apiKey === "string" ? input.apiKey.trim() : "";
      const model = typeof input?.model === "string" ? input.model.trim() : "";

      if (apiKey) {
        await setStoredOpenAiApiKey(apiKey);
      } else {
        const existing = await getStoredOpenAiApiKey();
        if (!existing) {
          throw new Error("OpenAI API key is required.");
        }
      }

      if (model) {
        await setStoredOpenAiModel(model);
      }
    }
  );

  ipcMain.handle("cv:openaiClearConfig", async (): Promise<void> => {
    await setStoredOpenAiApiKey(null);
    await setStoredOpenAiModel(null);
  });

  ipcMain.handle(
    "cv:openaiTest",
    async (
      _event,
      input: { apiKey?: string; model?: string } | undefined
    ): Promise<OpenAiTestResult> => {
      const apiKeyFromInput = typeof input?.apiKey === "string" ? input.apiKey.trim() : "";
      const apiKey = apiKeyFromInput || (await getStoredOpenAiApiKey()) || "";
      if (!apiKey) {
        throw new Error("OpenAI API key is not configured.");
      }

      const modelFromInput = typeof input?.model === "string" ? input.model.trim() : "";
      const model =
        modelFromInput || (await getStoredOpenAiModel()) || "gpt-4o-mini";

      return testOpenAi(apiKey, model);
    }
  );

  ipcMain.handle(
    "cv:openaiGenerateCvSuggestionsFromGitHub",
    async (
      _event,
      input: OpenAiGenerateCvSuggestionsInput | undefined
    ): Promise<OpenAiCvSuggestions> => {
      const apiKey = await getStoredOpenAiApiKey();
      if (!apiKey) {
        throw new Error("OpenAI API key is not configured. Open AI Settings and add your key.");
      }
      const model = (await getStoredOpenAiModel()) ?? "gpt-4o-mini";
      if (!input || !Array.isArray(input.repos)) {
        throw new Error("Invalid payload.");
      }
      return generateCvSuggestionsFromGitHubContext(apiKey, model, input);
    }
  );

  ipcMain.handle(
    "cv:openaiGenerateSummaryFromCv",
    async (
      _event,
      input: OpenAiGenerateSummaryFromCvInput | undefined
    ): Promise<OpenAiGenerateSummaryFromCvResult> => {
      const apiKey = await getStoredOpenAiApiKey();
      if (!apiKey) {
        throw new Error("OpenAI API key is not configured. Open AI Settings and add your key.");
      }
      const model = (await getStoredOpenAiModel()) ?? "gpt-4o-mini";
      if (!input) {
        throw new Error("Invalid payload.");
      }
      return generateSummaryFromCvContext(apiKey, model, input);
    }
  );

  ipcMain.handle(
    "cv:openaiGenerateSkillsFromCv",
    async (
      _event,
      input: OpenAiGenerateSkillsFromCvInput | undefined
    ): Promise<OpenAiGenerateSkillsFromCvResult> => {
      const apiKey = await getStoredOpenAiApiKey();
      if (!apiKey) {
        throw new Error("OpenAI API key is not configured. Open AI Settings and add your key.");
      }
      const model = (await getStoredOpenAiModel()) ?? "gpt-4o-mini";
      if (!input) {
        throw new Error("Invalid payload.");
      }
      return generateSkillsFromCvContext(apiKey, model, input);
    }
  );
}
