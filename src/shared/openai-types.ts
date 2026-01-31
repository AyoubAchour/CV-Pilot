export type OpenAiStatus = {
  configured: boolean;
  storageAvailable: boolean;
  model: string;
};

export type OpenAiRepoTreeSummary = {
  topLevel: string[];
  countsByExt: Record<string, number>;
  flags: string[];
  truncated: boolean;
};

export type OpenAiPackageJsonSummary = {
  deps: string[];
  devDeps: string[];
  scripts: string[];
};

export type OpenAiTestResult = {
  ok: boolean;
  model: string;
  message: string;
};

export type OpenAiRepoContext = {
  fullName: string;
  htmlUrl: string;
  description: string | null;
  language: string | null;
  topics?: string[];
  languages?: Record<string, number>;
  treeSummary?: OpenAiRepoTreeSummary;
  packageJson?: OpenAiPackageJsonSummary;
  updatedAt: string;
  pushedAt: string | null;
  readmeText: string | null;
  readmeTruncated: boolean;
};

export type OpenAiGenerateCvSuggestionsInput = {
  repos: OpenAiRepoContext[];
  existingProjectLinks: string[];
  existingSkills: string[];
  preferredName: string | null;
};

export type OpenAiProjectSuggestion = {
  repoFullName: string;
  title: string;
  date: string;
  link: string;
  highlights: string[];
};

export type OpenAiCvSuggestions = {
  projects: OpenAiProjectSuggestion[];
  skills: string[];
  notes: string[];
};

export type OpenAiGenerateSummaryFromCvInput = {
  headline: string | null;
  skills: string[];
  experience: Array<{ role: string; company: string; highlights: string[] }>;
  projects: Array<{ title: string; highlights: string[] }>;
  education: Array<{ school: string; degree: string }>;
};

export type OpenAiGenerateSummaryFromCvResult = {
  summary: string;
  notes: string[];
};
