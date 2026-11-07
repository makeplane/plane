/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

import { isPermissionLevel, type PermissionLevel } from "./levels.ts";

/**
 * Spawn tickets: how the bridge tells the runner which agent to start for whom.
 *
 * A ticket is `v1.<payload>.<signature>`, where `payload` is the base64url JSON claims and
 * `signature` is base64url HMAC-SHA256 over `v1.<payload>` keyed with `AGENT_RUNNER_SECRET`.
 * Tickets are short-lived and single-use (the runner remembers each `jti` until it expires).
 *
 * The claims carry the agent's env (provider API keys) in the clear: the signature gives
 * integrity, not secrecy. The ticket travels only on the internal bridge → runner hop, in the
 * `Authorization` header of the WebSocket upgrade, and neither side logs it.
 */

const VERSION = "v1";
/** Default ticket lifetime: long enough for one WebSocket upgrade, short enough to be useless when leaked. */
export const DEFAULT_TICKET_TTL_MS = 60_000;
/** The runner refuses tickets that claim a longer lifetime than this. */
export const MAX_TICKET_TTL_MS = 5 * 60_000;
/** Tolerated clock skew between bridge and runner. */
const CLOCK_SKEW_MS = 5_000;
export const MIN_SECRET_LENGTH = 32;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ADAPTER = /^[a-z][a-z0-9_-]{0,31}$/;
const ENV_KEY = /^[A-Z][A-Z0-9_]{0,63}$/;

/**
 * What a ticket is good for. `acp` (the default when absent) opens one agent over `/acp`; `login`
 * drives the provider sign-in helper over the runner's `/auth/*` endpoints. Each endpoint refuses
 * the other kind, so a sign-in ticket can never start an agent and vice versa.
 */
export const SPAWN_PURPOSES = ["acp", "login"] as const;
export type SpawnPurpose = (typeof SPAWN_PURPOSES)[number];

export function isSpawnPurpose(value: unknown): value is SpawnPurpose {
  return typeof value === "string" && (SPAWN_PURPOSES as readonly string[]).includes(value);
}

export interface SpawnClaims {
  /** Adapter id; the runner maps it to a fixed bin and never runs anything else. */
  readonly adapter: string;
  /** The agent's env from the admin config (flat `UPPER_SNAKE` → string). */
  readonly env: Readonly<Record<string, string>>;
  readonly userId: string;
  readonly workspaceId: string;
  /** Starting permission level, already clamped to the admin maximum by the bridge. */
  readonly initialMode: PermissionLevel;
  /** Correlation id for logs (the agent-session token id). Not a secret. */
  readonly sessionRef?: string;
  /** `acp` when absent. */
  readonly purpose?: SpawnPurpose;
}

export interface SpawnTicket extends SpawnClaims {
  /** Issued at, ms since the epoch. */
  readonly iat: number;
  /** Expires at, ms since the epoch. */
  readonly exp: number;
  /** Unique id, for single-use enforcement. */
  readonly jti: string;
}

/** The ticket's purpose, `acp` when the claim is absent. */
export function ticketPurpose(claims: Pick<SpawnClaims, "purpose">): SpawnPurpose {
  return claims.purpose ?? "acp";
}

export type TicketFailure = "malformed" | "bad_signature" | "expired" | "not_yet_valid" | "invalid_claims";

export type TicketVerification =
  | { readonly ok: true; readonly ticket: SpawnTicket }
  | { readonly ok: false; readonly reason: TicketFailure };

export function assertTicketSecret(secret: string, name = "secret"): void {
  if (typeof secret !== "string" || secret.length < MIN_SECRET_LENGTH) {
    throw new Error(`${name} must be at least ${MIN_SECRET_LENGTH} characters`);
  }
}

function sign(body: string, secret: string): Buffer {
  return createHmac("sha256", secret).update(body).digest();
}

export interface SignOptions {
  readonly ttlMs?: number;
  readonly now?: number;
  readonly jti?: string;
}

export function signSpawnTicket(claims: SpawnClaims, secret: string, options: SignOptions = {}): string {
  assertTicketSecret(secret);
  const now = options.now ?? Date.now();
  const ticket: SpawnTicket = {
    ...claims,
    iat: now,
    exp: now + (options.ttlMs ?? DEFAULT_TICKET_TTL_MS),
    jti: options.jti ?? randomUUID(),
  };
  const payload = Buffer.from(JSON.stringify(ticket)).toString("base64url");
  const body = `${VERSION}.${payload}`;
  return `${body}.${sign(body, secret).toString("base64url")}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseClaims(value: unknown): SpawnTicket | undefined {
  if (!isRecord(value)) return undefined;
  const { adapter, env, userId, workspaceId, initialMode, sessionRef, purpose, iat, exp, jti } = value;
  if (typeof adapter !== "string" || !ADAPTER.test(adapter)) return undefined;
  if (typeof userId !== "string" || !UUID.test(userId)) return undefined;
  if (typeof workspaceId !== "string" || !UUID.test(workspaceId)) return undefined;
  if (!isPermissionLevel(initialMode)) return undefined;
  if (sessionRef !== undefined && typeof sessionRef !== "string") return undefined;
  if (purpose !== undefined && !isSpawnPurpose(purpose)) return undefined;
  if (!Number.isSafeInteger(iat) || !Number.isSafeInteger(exp)) return undefined;
  if (typeof jti !== "string" || jti.length === 0 || jti.length > 128) return undefined;
  if (!isRecord(env)) return undefined;
  const cleanEnv: Record<string, string> = {};
  for (const [key, val] of Object.entries(env)) {
    if (!ENV_KEY.test(key) || typeof val !== "string") return undefined;
    cleanEnv[key] = val;
  }
  return {
    adapter,
    env: cleanEnv,
    userId: userId.toLowerCase(),
    workspaceId: workspaceId.toLowerCase(),
    initialMode,
    ...(typeof sessionRef === "string" ? { sessionRef } : {}),
    ...(purpose !== undefined ? { purpose } : {}),
    iat: iat as number,
    exp: exp as number,
    jti,
  };
}

export interface VerifyOptions {
  readonly now?: number;
  readonly maxTtlMs?: number;
}

export function verifySpawnTicket(token: string, secret: string, options: VerifyOptions = {}): TicketVerification {
  assertTicketSecret(secret);
  const parts = typeof token === "string" ? token.split(".") : [];
  if (parts.length !== 3 || parts[0] !== VERSION || !parts[1] || !parts[2]) return { ok: false, reason: "malformed" };
  const [version, payload, signature] = parts as [string, string, string];

  const expected = sign(`${version}.${payload}`, secret);
  const provided = Buffer.from(signature, "base64url");
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return { ok: false, reason: "bad_signature" };
  }

  let decoded: unknown;
  try {
    decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return { ok: false, reason: "malformed" };
  }
  const ticket = parseClaims(decoded);
  if (!ticket) return { ok: false, reason: "invalid_claims" };

  const now = options.now ?? Date.now();
  if (ticket.exp - ticket.iat > (options.maxTtlMs ?? MAX_TICKET_TTL_MS)) return { ok: false, reason: "invalid_claims" };
  if (ticket.iat > now + CLOCK_SKEW_MS) return { ok: false, reason: "not_yet_valid" };
  if (ticket.exp <= now) return { ok: false, reason: "expired" };
  return { ok: true, ticket };
}

/** Remembers used ticket ids until they expire, so a captured ticket cannot be replayed. */
export class TicketReplayGuard {
  readonly #seen = new Map<string, number>();

  /** Records `ticket` and returns true the first time it is seen, false on a replay. */
  claim(ticket: SpawnTicket, now = Date.now()): boolean {
    for (const [jti, exp] of this.#seen) if (exp <= now) this.#seen.delete(jti);
    if (this.#seen.has(ticket.jti)) return false;
    this.#seen.set(ticket.jti, ticket.exp);
    return true;
  }

  get size(): number {
    return this.#seen.size;
  }
}
