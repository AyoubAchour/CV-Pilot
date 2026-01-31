import { randomUUID } from "node:crypto";

import type {
  GitHubAuthBeginResult,
  GitHubAuthPollResult,
} from "../../shared/github-types";

import { getGitHubOAuthClientId } from "./config";

type GitHubAuthSession = {
  sessionId: string;
  includePrivate: boolean;
  clientId: string;
  deviceCode: string;
  userCode: string;
  verificationUri: string;
  expiresAt: number;
  intervalSeconds: number;
};

export class GitHubDeviceFlowService {
  private sessions = new Map<string, GitHubAuthSession>();

  // Internal result includes the access token when authorized.
  // This is intentionally not exposed to the renderer via IPC.
  private static withAccessToken(
    result: GitHubAuthPollResult,
    accessToken?: string
  ): GitHubAuthPollResult & { accessToken?: string } {
    return { ...result, ...(accessToken ? { accessToken } : {}) };
  }

  async beginAuth(includePrivate: boolean): Promise<GitHubAuthBeginResult> {
    const clientId = getGitHubOAuthClientId();
    const scope = includePrivate ? "read:user repo" : "read:user";

    const body = new URLSearchParams();
    body.set("client_id", clientId);
    body.set("scope", scope);

    type DeviceCodeResponse = {
      device_code: string;
      user_code: string;
      verification_uri: string;
      expires_in: number;
      interval: number;
    };

    const res = await fetch("https://github.com/login/device/code", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    const status = res.status;
    const text = await res.text();
    let json: DeviceCodeResponse;
    try {
      json = JSON.parse(text) as DeviceCodeResponse;
    } catch {
      throw new Error(`GitHub device flow start returned non-JSON (${status}).`);
    }

    if (status >= 400) {
      throw new Error(`GitHub device flow start failed (${status}).`);
    }

    const sessionId = randomUUID();
    const expiresAt = Date.now() + (json.expires_in ?? 0) * 1000;
    const intervalSeconds = Math.max(5, Number(json.interval ?? 5));

    const session: GitHubAuthSession = {
      sessionId,
      includePrivate,
      clientId,
      deviceCode: json.device_code,
      userCode: json.user_code,
      verificationUri: json.verification_uri,
      expiresAt,
      intervalSeconds,
    };

    this.sessions.set(sessionId, session);

    return {
      sessionId,
      userCode: session.userCode,
      verificationUri: session.verificationUri,
      expiresIn: json.expires_in,
      interval: intervalSeconds,
    };
  }

  async pollAuth(
    sessionId: string
  ): Promise<GitHubAuthPollResult & { accessToken?: string }> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { status: "error", message: "Unknown auth session." };
    }

    if (Date.now() > session.expiresAt) {
      this.sessions.delete(sessionId);
      return { status: "expired", message: "Device code expired. Please try again." };
    }

    const body = new URLSearchParams();
    body.set("client_id", session.clientId);
    body.set("device_code", session.deviceCode);
    body.set("grant_type", "urn:ietf:params:oauth:grant-type:device_code");

    type TokenResponse =
      | { access_token: string; token_type: string; scope: string }
      | { error: string; error_description?: string; interval?: number };

    const res = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    const status = res.status;
    const text = await res.text();
    let json: TokenResponse;
    try {
      json = JSON.parse(text) as TokenResponse;
    } catch {
      return { status: "error", message: `Token polling returned non-JSON (${status}).` };
    }

    if (status >= 400) {
      return { status: "error", message: `Token polling failed (${status}).` };
    }

    if ("access_token" in json && typeof json.access_token === "string") {
      this.sessions.delete(sessionId);
      return GitHubDeviceFlowService.withAccessToken(
        { status: "authorized" },
        json.access_token
      );
    }

    const errCode = "error" in json ? json.error : undefined;
    if (errCode === "authorization_pending") {
      return { status: "pending" };
    }

    if (errCode === "slow_down") {
      const nextIntervalFromServer =
        "interval" in json && typeof json.interval === "number" ? json.interval : null;
      const nextInterval = nextIntervalFromServer ?? session.intervalSeconds + 5;
      session.intervalSeconds = Math.max(session.intervalSeconds, nextInterval);
      this.sessions.set(sessionId, session);
      return {
        status: "pending",
        interval: session.intervalSeconds,
        message: "GitHub asked to slow down polling.",
      };
    }

    if (errCode === "access_denied") {
      this.sessions.delete(sessionId);
      return { status: "denied", message: "Authorization was cancelled." };
    }

    if (errCode === "expired_token" || errCode === "token_expired") {
      this.sessions.delete(sessionId);
      return { status: "expired", message: "Device code expired. Please try again." };
    }

    const errorDescription = "error_description" in json ? json.error_description : undefined;
    return { status: "error", message: errorDescription ?? "Authorization failed." };
  }
}
