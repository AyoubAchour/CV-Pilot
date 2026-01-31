import type { GitHubRepoSummary } from "./github-types";
import type { OpenAiRepoContext } from "./openai-types";

export type RepoContextPackInclude = {
  topics?: boolean;
  languages?: boolean;
  tree?: boolean;
  packageJson?: boolean;
};

export type GitHubBuildRepoContextPackInput = {
  repos: GitHubRepoSummary[];
  include?: RepoContextPackInclude;
};

export type GitHubBuildRepoContextPackResult = {
  repos: OpenAiRepoContext[];
  warnings: string[];
};
