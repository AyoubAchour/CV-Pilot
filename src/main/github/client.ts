import type {
  GitHubReadmeResult,
  GitHubRepoSummary,
  GitHubUserProfile,
} from "../../shared/github-types";

async function githubRequestJson<T>(
  url: string,
  options: RequestInit
): Promise<{ status: number; headers: Headers; json: T }> {
  const res = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.headers ?? {}),
    },
  });

  const status = res.status;
  const headers = res.headers;
  const text = await res.text();
  let json: T;
  try {
    json = JSON.parse(text) as T;
  } catch {
    throw new Error(`GitHub API returned non-JSON (${status}).`);
  }
  return { status, headers, json };
}

async function githubApiJson<T>(
  pathOrUrl: string,
  token: string
): Promise<{ status: number; headers: Headers; json: T }> {
  const url = pathOrUrl.startsWith("http")
    ? pathOrUrl
    : `https://api.github.com${pathOrUrl}`;

  return githubRequestJson<T>(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
}

async function githubApiJsonWithHeaders<T>(
  pathOrUrl: string,
  token: string,
  extraHeaders: Record<string, string>
): Promise<{ status: number; headers: Headers; json: T }> {
  const url = pathOrUrl.startsWith("http")
    ? pathOrUrl
    : `https://api.github.com${pathOrUrl}`;

  return githubRequestJson<T>(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...extraHeaders,
    },
  });
}

function parseNextLink(headers: Headers): string | null {
  const link = headers.get("link");
  if (!link) {
    return null;
  }

  const parts = link.split(",").map((p) => p.trim());
  for (const part of parts) {
    // <url>; rel="next"
    const match = part.match(/^<([^>]+)>;\s*rel="([^"]+)"$/);
    if (match && match[2] === "next") {
      return match[1];
    }
  }
  return null;
}

async function githubListAllPages<T>(
  firstUrl: string,
  token: string
): Promise<T[]> {
  const items: T[] = [];
  let nextUrl: string | null = firstUrl;

  while (nextUrl) {
    const { headers, json, status } = await githubApiJson<T[]>(nextUrl, token);
    if (status >= 400) {
      throw new Error(`GitHub API error (${status}).`);
    }
    items.push(...json);
    nextUrl = parseNextLink(headers);
  }

  return items;
}

export async function githubGetProfile(token: string): Promise<GitHubUserProfile> {
  type Raw = {
    login: string;
    name: string | null;
    html_url: string;
    blog: string | null;
    location: string | null;
  };

  const { status, json } = await githubApiJson<Raw>("/user", token);
  if (status >= 400) {
    throw new Error(`GitHub profile fetch failed (${status}).`);
  }

  return {
    login: json.login,
    name: json.name,
    htmlUrl: json.html_url,
    blog: json.blog,
    location: json.location,
  };
}

export async function githubListRepos(
  token: string,
  includePrivate: boolean
): Promise<GitHubRepoSummary[]> {
  const base = `https://api.github.com/user/repos?per_page=100&sort=updated&direction=desc${
    includePrivate ? "" : "&visibility=public"
  }`;

  type RawRepo = {
    id: number;
    name: string;
    full_name: string;
    private: boolean;
    html_url: string;
    description: string | null;
    language: string | null;
    default_branch: string;
    updated_at: string;
    pushed_at: string | null;
    owner: { login: string };
  };

  const repos = await githubListAllPages<RawRepo>(base, token);

  return repos.map((r) => ({
    id: r.id,
    name: r.name,
    fullName: r.full_name,
    private: r.private,
    htmlUrl: r.html_url,
    description: r.description,
    language: r.language,
    defaultBranch: typeof r.default_branch === "string" && r.default_branch.trim().length > 0 ? r.default_branch : "main",
    updatedAt: r.updated_at,
    pushedAt: r.pushed_at,
    owner: r.owner?.login ?? r.full_name.split("/")[0] ?? "",
  }));
}

export async function githubGetRepoTopics(
  token: string,
  owner: string,
  repo: string
): Promise<string[]> {
  type Raw = { names: string[] };

  const path = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/topics`;

  const { status, json } = await githubApiJsonWithHeaders<Raw>(path, token, {
    Accept: "application/vnd.github+json",
  });

  if (status === 404) {
    return [];
  }
  if (status >= 400) {
    throw new Error(`GitHub topics fetch failed (${status}).`);
  }

  return Array.isArray(json?.names)
    ? json.names.filter((n): n is string => typeof n === "string").map((n) => n.trim()).filter(Boolean)
    : [];
}

export async function githubGetRepoLanguages(
  token: string,
  owner: string,
  repo: string
): Promise<Record<string, number>> {
  const path = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/languages`;
  const { status, json } = await githubApiJson<Record<string, number>>(path, token);

  if (status === 404) {
    return {};
  }
  if (status >= 400) {
    throw new Error(`GitHub languages fetch failed (${status}).`);
  }

  const out: Record<string, number> = {};
  if (json && typeof json === "object") {
    for (const [key, value] of Object.entries(json)) {
      if (typeof key === "string" && typeof value === "number" && Number.isFinite(value) && value > 0) {
        out[key] = value;
      }
    }
  }
  return out;
}

export type GitHubTreeEntry = {
  path: string;
  mode: string;
  type: "blob" | "tree" | string;
  sha: string;
  size?: number;
  url?: string;
};

export type GitHubTreeResult = {
  sha: string;
  tree: GitHubTreeEntry[];
  truncated: boolean;
};

export async function githubGetRepoTree(
  token: string,
  owner: string,
  repo: string,
  treeShaOrRef: string,
  recursive: boolean
): Promise<GitHubTreeResult> {
  const base = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/trees/${encodeURIComponent(
    treeShaOrRef
  )}`;
  const path = recursive ? `${base}?recursive=1` : base;

  const { status, json } = await githubApiJson<GitHubTreeResult>(path, token);
  if (status === 404) {
    return { sha: "", tree: [], truncated: false };
  }
  if (status >= 400) {
    throw new Error(`GitHub tree fetch failed (${status}).`);
  }

  const tree = Array.isArray(json?.tree) ? json.tree : [];
  return {
    sha: typeof json?.sha === "string" ? json.sha : "",
    tree: tree
      .filter((e): e is GitHubTreeEntry => !!e && typeof e === "object")
      .map((e) => e as GitHubTreeEntry),
    truncated: json?.truncated === true,
  };
}

export async function githubGetRepoFileRaw(
  token: string,
  owner: string,
  repo: string,
  filePath: string,
  ref?: string
): Promise<string | null> {
  const base = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${filePath
    .split("/")
    .map((p) => encodeURIComponent(p))
    .join("/")}`;

  const url = ref && ref.trim().length > 0 ? `${base}?ref=${encodeURIComponent(ref.trim())}` : base;

  const res = await fetch(`https://api.github.com${url}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      Accept: "application/vnd.github.raw+json",
    },
  });

  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    throw new Error(`GitHub contents fetch failed (${res.status}).`);
  }

  return res.text();
}

export async function githubGetRepoReadme(
  token: string,
  owner: string,
  repo: string
): Promise<GitHubReadmeResult> {
  const url = `https://api.github.com/repos/${encodeURIComponent(
    owner
  )}/${encodeURIComponent(repo)}/readme`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      // Use the documented raw media type so we get plain text rather than base64.
      Accept: "application/vnd.github.raw+json",
    },
  });

  if (res.status === 404) {
    return { text: null, truncated: false };
  }
  if (!res.ok) {
    throw new Error(
      `Failed to fetch README for ${owner}/${repo} (${res.status}).`
    );
  }

  const text = await res.text();
  const MAX = 40_000;
  if (text.length > MAX) {
    return { text: text.slice(0, MAX), truncated: true };
  }

  return { text, truncated: false };
}
