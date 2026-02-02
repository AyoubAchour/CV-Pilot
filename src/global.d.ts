export {};

import type { CvDocument } from "./shared/cv-model";

declare module "*?url" {
  const src: string;
  export default src;
}

declare global {
  interface ProjectSummary {
    id: string;
    title: string;
    customTitle?: string;
    lastEdited: string;
    tags: string[];
  }

  interface CreateBlankCvProjectResult {
    project: ProjectSummary;
    cv: CvDocument;
  }

  interface SaveProjectCvInput {
    projectId: string;
    cv: CvDocument;
  }

  interface ExportCvPdfInput {
    projectId: string;
    cv: CvDocument;
    suggestedFileName?: string;
  }

  type ExportCvPdfResult =
    | { canceled: true }
    | {
        canceled: false;
        savedPath: string;
      };

  type GitHubAuthBeginResult = {
    sessionId: string;
    userCode: string;
    verificationUri: string;
    expiresIn: number;
    interval: number;
  };

  type GitHubAuthPollResult = {
    status: "pending" | "authorized" | "denied" | "expired" | "error";
    interval?: number;
    message?: string;
  };

  type GitHubUserProfile = {
    login: string;
    name: string | null;
    htmlUrl: string;
    blog: string | null;
    location: string | null;
  };

  type GitHubRepoSummary = {
    id: number;
    name: string;
    fullName: string;
    private: boolean;
    htmlUrl: string;
    description: string | null;
    language: string | null;
    defaultBranch: string;
    updatedAt: string;
    pushedAt: string | null;
    owner: string;
  };

  type GitHubReadmeResult = {
    text: string | null;
    truncated: boolean;
  };

  type OpenAiStatus = {
    configured: boolean;
    storageAvailable: boolean;
    model: string;
  };

  type OpenAiRepoContext = {
    fullName: string;
    htmlUrl: string;
    description: string | null;
    language: string | null;
    topics?: string[];
    languages?: Record<string, number>;
    treeSummary?: {
      topLevel: string[];
      countsByExt: Record<string, number>;
      flags: string[];
      truncated: boolean;
    };
    packageJson?: {
      deps: string[];
      devDeps: string[];
      scripts: string[];
    };
    updatedAt: string;
    pushedAt: string | null;
    readmeText: string | null;
    readmeTruncated: boolean;
  };

  type OpenAiGenerateCvSuggestionsInput = {
    repos: OpenAiRepoContext[];
    existingProjectLinks: string[];
    existingSkills: string[];
    preferredName: string | null;
  };

  type OpenAiProjectSuggestion = {
    repoFullName: string;
    title: string;
    date: string;
    link: string;
    highlights: string[];
  };

  type OpenAiCvSuggestions = {
    projects: OpenAiProjectSuggestion[];
    skills: string[];
    notes: string[];
  };

  type OpenAiGenerateSummaryFromCvInput = {
    headline: string | null;
    skills: string[];
    experience: Array<{ role: string; company: string; highlights: string[] }>;
    projects: Array<{ title: string; highlights: string[] }>;
    education: Array<{ school: string; degree: string }>;
  };

  type OpenAiGenerateSummaryFromCvResult = {
    summary: string;
    notes: string[];
  };

  type OpenAiGenerateSkillsFromCvInput = {
    headline: string | null;
    existingSkills: string[];
    experience: Array<{ role: string; company: string; highlights: string[] }>;
    projects: Array<{ title: string; highlights: string[] }>;
    education: Array<{ school: string; degree: string }>;
  };

  type OpenAiGenerateSkillsFromCvResult = {
    skills: string[];
    notes: string[];
  };

  type OpenAiTestResult = {
    ok: boolean;
    model: string;
    message: string;
  };

  interface Window {
    cvPilot: {
      listProjects: () => Promise<ProjectSummary[]>;

      createBlankCvProject: () => Promise<CreateBlankCvProjectResult>;
      getProjectCv: (projectId: string) => Promise<CvDocument>;
      saveProjectCv: (input: SaveProjectCvInput) => Promise<void>;
      deleteProject: (projectId: string) => Promise<void>;
      renameProject: (input: { projectId: string; customTitle: string }) => Promise<{ title: string }>;
      exportCvPdf: (input: ExportCvPdfInput) => Promise<ExportCvPdfResult>;

      githubDisconnect: () => Promise<void>;
      githubBeginAuth: (input: { includePrivate?: boolean }) => Promise<GitHubAuthBeginResult>;
      githubPollAuth: (input: { sessionId: string }) => Promise<GitHubAuthPollResult>;
      githubGetProfile: () => Promise<GitHubUserProfile>;
      githubListRepos: (input: { includePrivate?: boolean }) => Promise<GitHubRepoSummary[]>;
      githubGetReadme: (input: { owner: string; repo: string }) => Promise<GitHubReadmeResult>;

      githubBuildRepoContextPack: (input: {
        repos: GitHubRepoSummary[];
        include?: {
          topics?: boolean;
          languages?: boolean;
          tree?: boolean;
          packageJson?: boolean;
        };
      }) => Promise<{ repos: OpenAiRepoContext[]; warnings: string[] }>;

      openaiGetStatus: () => Promise<OpenAiStatus>;
      openaiSetConfig: (input: { apiKey?: string; model?: string }) => Promise<void>;
      openaiClearConfig: () => Promise<void>;
      openaiGenerateCvSuggestionsFromGitHub: (
        input: OpenAiGenerateCvSuggestionsInput
      ) => Promise<OpenAiCvSuggestions>;

      openaiGenerateSummaryFromCv: (
        input: OpenAiGenerateSummaryFromCvInput
      ) => Promise<OpenAiGenerateSummaryFromCvResult>;

      openaiGenerateSkillsFromCv: (
        input: OpenAiGenerateSkillsFromCvInput
      ) => Promise<OpenAiGenerateSkillsFromCvResult>;

      openaiTest: (input?: { apiKey?: string; model?: string }) => Promise<OpenAiTestResult>;
    };
  }
}
