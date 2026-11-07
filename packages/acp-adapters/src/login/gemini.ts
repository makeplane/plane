/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { createHash, randomBytes } from "node:crypto";
import { readdirSync, readFileSync, realpathSync, statSync } from "node:fs";
import path from "node:path";

import { objectValue, stringValue } from "../core/json.ts";
import {
  GEMINI_DIR,
  GOOGLE_ACCOUNTS_FILE,
  GOOGLE_AUTH_TYPE,
  OAUTH_CREDS_FILE,
  googleAccountEmail,
  hasGoogleCredentials,
  setSelectedAuthType,
  writePrivateJson,
} from "../gemini/files.ts";
import { failed, removeFiles, within, type LoginEvent, type LoginIo } from "./shared.ts";

/**
 * Gemini CLI's Google sign-in. The OAuth client is Gemini CLI's own "installed app" client: its
 * secret is public by design and ships in the CLI bundle. It is read from the installed `gemini`
 * at sign-in time (see `geminiOAuthClient`) rather than copied here, so it always matches the
 * pinned CLI. Signing in with the same client and scopes yields the credentials Gemini CLI caches
 * itself, so `gemini --acp` can use and refresh them.
 */
export const GEMINI_OAUTH = {
  scopes: [
    "https://www.googleapis.com/auth/cloud-platform",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
  ],
  authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenUrl: "https://oauth2.googleapis.com/token",
  userinfoUrl: "https://www.googleapis.com/oauth2/v2/userinfo",
  /** Google shows the authorization code on this page for the user to paste back. */
  redirectUri: "https://codeassist.google.com/authcode",
} as const;

/** Test overrides for the endpoints and the OAuth client. */
export const GEMINI_LOGIN_ENV = {
  tokenUrl: "PLANE_GEMINI_OAUTH_TOKEN_URL",
  userinfoUrl: "PLANE_GEMINI_USERINFO_URL",
  clientId: "PLANE_GEMINI_OAUTH_CLIENT_ID",
  clientSecret: "PLANE_GEMINI_OAUTH_CLIENT_SECRET",
} as const;

export interface GeminiOAuthClient {
  readonly clientId: string;
  readonly clientSecret: string;
}

const CLIENT_ID_PATTERN = /\bOAUTH_CLIENT_ID = "([0-9a-z-]+\.apps\.googleusercontent\.com)"/;
const CLIENT_SECRET_PATTERN = /\bOAUTH_CLIENT_SECRET = "([A-Za-z0-9_-]+)"/;

function findOnPath(command: string, searchPath: string | undefined): string | undefined {
  for (const dir of (searchPath ?? "").split(path.delimiter)) {
    if (!dir) continue;
    const candidate = path.join(dir, command);
    try {
      if (statSync(candidate).isFile()) return candidate;
    } catch {
      // not in this dir
    }
  }
  return undefined;
}

/**
 * Gemini CLI's OAuth client, read from the bundle of the `gemini` on `PATH` (the npm bin is a
 * symlink to `<package>/bundle/gemini.js`, and the constants live in one of the bundle's chunks).
 */
export function geminiOAuthClient(env: NodeJS.ProcessEnv): GeminiOAuthClient {
  const clientId = env[GEMINI_LOGIN_ENV.clientId];
  const clientSecret = env[GEMINI_LOGIN_ENV.clientSecret];
  if (clientId && clientSecret) return { clientId, clientSecret };

  const bin = findOnPath("gemini", env.PATH);
  if (!bin) throw new Error("Gemini CLI is not installed (no `gemini` on PATH)");
  const bundleDir = path.dirname(realpathSync(bin));
  let foundId: string | undefined;
  let foundSecret: string | undefined;
  for (const name of readdirSync(bundleDir)) {
    if (!name.endsWith(".js")) continue;
    const source = readFileSync(path.join(bundleDir, name), "utf8");
    foundId ??= CLIENT_ID_PATTERN.exec(source)?.[1];
    foundSecret ??= CLIENT_SECRET_PATTERN.exec(source)?.[1];
    if (foundId && foundSecret) return { clientId: foundId, clientSecret: foundSecret };
  }
  throw new Error(`Gemini CLI's OAuth client was not found in ${bundleDir}`);
}

/** The user has this long to sign in and paste the code. */
export const GEMINI_LOGIN_TIMEOUT_MS = 10 * 60_000;
const HTTP_TIMEOUT_MS = 30_000;

function base64url(data: Buffer): string {
  return data.toString("base64url");
}

/** PKCE (S256) verifier and challenge. */
export function pkcePair(): { verifier: string; challenge: string } {
  const verifier = base64url(randomBytes(32));
  return { verifier, challenge: base64url(createHash("sha256").update(verifier).digest()) };
}

export function geminiAuthUrl(client: GeminiOAuthClient, challenge: string, state: string): string {
  const params = new URLSearchParams({
    client_id: client.clientId,
    redirect_uri: GEMINI_OAUTH.redirectUri,
    response_type: "code",
    scope: GEMINI_OAUTH.scopes.join(" "),
    access_type: "offline",
    prompt: "consent",
    code_challenge: challenge,
    code_challenge_method: "S256",
    state,
  });
  return `${GEMINI_OAUTH.authUrl}?${params.toString()}`;
}

/**
 * The authorization code from the user's answer `{"code": "…"}`. A pasted redirect URL or query
 * string is accepted too; its `state`, when present, must match.
 */
export function authorizationCode(answer: unknown, state: string): string | undefined {
  const raw = stringValue(objectValue(answer).code).trim();
  if (!raw) return undefined;
  if (!raw.includes("code=")) return raw;
  const query = new URLSearchParams(raw.includes("?") ? raw.slice(raw.indexOf("?") + 1) : raw);
  const returnedState = query.get("state");
  if (returnedState && returnedState !== state) return undefined;
  return query.get("code") ?? undefined;
}

function geminiDirOf(io: LoginIo): string {
  return path.join(io.home, GEMINI_DIR);
}

async function exchangeCode(
  io: LoginIo,
  client: GeminiOAuthClient,
  code: string,
  verifier: string
): Promise<Record<string, unknown>> {
  const response = await fetch(io.env[GEMINI_LOGIN_ENV.tokenUrl] || GEMINI_OAUTH.tokenUrl, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
    body: new URLSearchParams({
      code,
      client_id: client.clientId,
      client_secret: client.clientSecret,
      redirect_uri: GEMINI_OAUTH.redirectUri,
      grant_type: "authorization_code",
      code_verifier: verifier,
    }).toString(),
    signal: AbortSignal.any([io.signal, AbortSignal.timeout(HTTP_TIMEOUT_MS)]),
  });
  const body = objectValue(await response.json().catch(() => ({})));
  if (!response.ok || !stringValue(body.access_token)) {
    const reason = stringValue(body.error_description) || stringValue(body.error) || `HTTP ${response.status}`;
    throw new Error(`Google rejected the authorization code: ${reason}`);
  }
  return body;
}

async function fetchEmail(io: LoginIo, accessToken: string): Promise<string | undefined> {
  try {
    const response = await fetch(io.env[GEMINI_LOGIN_ENV.userinfoUrl] || GEMINI_OAUTH.userinfoUrl, {
      headers: { authorization: `Bearer ${accessToken}`, accept: "application/json" },
      signal: AbortSignal.any([io.signal, AbortSignal.timeout(HTTP_TIMEOUT_MS)]),
    });
    if (!response.ok) return undefined;
    return stringValue(objectValue(await response.json()).email) || undefined;
  } catch {
    return undefined;
  }
}

/**
 * `gemini start`: Google sign-in with PKCE through Gemini CLI's OAuth client. The user opens the
 * URL, signs in, and pastes the code Google shows; the credentials land where Gemini CLI caches its
 * own (`~/.gemini/oauth_creds.json`, `google_accounts.json`, `selectedType` in `settings.json`).
 */
export async function geminiStart(io: LoginIo): Promise<LoginEvent> {
  let client: GeminiOAuthClient;
  try {
    client = geminiOAuthClient(io.env);
  } catch (error) {
    return failed(error instanceof Error ? error.message : String(error));
  }
  const { verifier, challenge } = pkcePair();
  const state = randomBytes(32).toString("hex");
  io.emit({ event: "pending", verificationUrl: geminiAuthUrl(client, challenge, state), needsCode: true });

  const answer = await within(io.readLine(), io.signal, GEMINI_LOGIN_TIMEOUT_MS);
  if (!("value" in answer)) {
    return failed(answer.stopped === "timeout" ? "the Google sign-in timed out" : "the Google sign-in was cancelled");
  }
  if (answer.value === undefined) return failed("the Google sign-in was cancelled");
  const code = authorizationCode(answer.value, state);
  if (!code) return failed("no valid authorization code was given");

  const tokens = await exchangeCode(io, client, code, verifier);
  const expiresIn = Number(tokens.expires_in);
  const credentials = Object.fromEntries(
    Object.entries({
      access_token: stringValue(tokens.access_token),
      refresh_token: stringValue(tokens.refresh_token) || undefined,
      scope: stringValue(tokens.scope) || undefined,
      token_type: stringValue(tokens.token_type) || "Bearer",
      id_token: stringValue(tokens.id_token) || undefined,
      expiry_date: Number.isFinite(expiresIn) ? Date.now() + expiresIn * 1000 : undefined,
    }).filter(([, value]) => value !== undefined)
  );
  const dir = geminiDirOf(io);
  writePrivateJson(path.join(dir, OAUTH_CREDS_FILE), credentials);
  setSelectedAuthType(dir, GOOGLE_AUTH_TYPE);
  const email = await fetchEmail(io, stringValue(tokens.access_token));
  if (email) writePrivateJson(path.join(dir, GOOGLE_ACCOUNTS_FILE), { active: email, old: [] });
  else removeFiles(path.join(dir, GOOGLE_ACCOUNTS_FILE));
  return { event: "connected", account: { email: email ?? null } };
}

/** `gemini status`: is there a cached Google sign-in, and as whom. */
export function geminiStatus(io: LoginIo): LoginEvent {
  const dir = geminiDirOf(io);
  if (!hasGoogleCredentials(dir)) return { event: "status", connected: false };
  return { event: "status", connected: true, account: { email: googleAccountEmail(dir) ?? null } };
}

/** `gemini logout`: forget the Google sign-in. */
export function geminiLogout(io: LoginIo): void {
  const dir = geminiDirOf(io);
  removeFiles(path.join(dir, OAUTH_CREDS_FILE), path.join(dir, GOOGLE_ACCOUNTS_FILE));
  setSelectedAuthType(dir, undefined);
}
