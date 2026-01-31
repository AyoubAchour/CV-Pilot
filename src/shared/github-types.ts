export type GitHubAuthBeginInput = {
  includePrivate?: boolean;
};

export type GitHubAuthBeginResult = {
  sessionId: string;
  userCode: string;
  verificationUri: string;
  expiresIn: number;
  interval: number;
};

export type GitHubAuthPollInput = {
  sessionId: string;
};

export type GitHubAuthPollResult = {
  status: "pending" | "authorized" | "denied" | "expired" | "error";
  interval?: number;
  message?: string;
};

export type GitHubUserProfile = {
  login: string;
  name: string | null;
  htmlUrl: string;
  blog: string | null;
  location: string | null;
};

export type GitHubRepoSummary = {
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

export type GitHubReadmeResult = {
  text: string | null;
  truncated: boolean;
};
