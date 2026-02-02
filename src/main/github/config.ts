export function getGitHubOAuthClientId(): string {
  const fromEnv =
    process.env.VITA_GITHUB_CLIENT_ID ?? process.env.CV_PILOT_GITHUB_CLIENT_ID;

  const bakedVita =
    typeof __VITA_GITHUB_CLIENT_ID__ !== "undefined" ? __VITA_GITHUB_CLIENT_ID__ : "";

  const bakedLegacy =
    typeof __CV_PILOT_GITHUB_CLIENT_ID__ !== "undefined"
      ? __CV_PILOT_GITHUB_CLIENT_ID__
      : "";

  const fromBaked = bakedVita.trim().length > 0 ? bakedVita : bakedLegacy;

  const raw = (fromEnv ?? "").trim().length > 0 ? fromEnv : fromBaked;

  // Users sometimes wrap values in quotes in `.env`.
  const clientId = (raw ?? "")
    .trim()
    .replace(/^['"]+/, "")
    .replace(/['"]+$/, "")
    .trim();

  if (!clientId || clientId.length === 0) {
    throw new Error(
      "Missing GitHub OAuth client id. Set VITA_GITHUB_CLIENT_ID in your environment (or legacy CV_PILOT_GITHUB_CLIENT_ID)."
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
