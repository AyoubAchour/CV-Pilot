export function getGitHubOAuthClientId(): string {
  const clientId = process.env.CV_PILOT_GITHUB_CLIENT_ID;
  if (!clientId || clientId.trim().length === 0) {
    throw new Error(
      "Missing GitHub OAuth client id. Set CV_PILOT_GITHUB_CLIENT_ID in your environment."
    );
  }
  return clientId.trim();
}

export function isSafeGitHubVerificationUri(uri: string): boolean {
  try {
    const u = new URL(uri);
    return u.protocol === "https:" && u.hostname === "github.com" && u.pathname === "/login/device";
  } catch {
    return false;
  }
}
