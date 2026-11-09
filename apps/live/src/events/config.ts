/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { z } from "zod";

const intFrom = (fallback: number, min = 1) =>
  z
    .string()
    .optional()
    .transform((v) => (v === undefined || v.trim() === "" ? fallback : Number(v)))
    .pipe(z.number().int().min(min));

// The live events hub reads its own settings straight from the environment so that
// env.ts stays untouched. The Origin allowlist for the events socket is the union of
// LIVE_EVENTS_ALLOWED_ORIGINS and WEB_URL (plus the host-equality fallback in origin.ts when
// LIVE_EVENTS_ORIGIN_HOST_FALLBACK=1).
// CORS_ALLOWED_ORIGINS is deliberately not read: server.ts feeds it to the stock cors()
// middleware, so the deploy must not pass it into live. LIVE_EVENTS_ALLOWED_ORIGINS is the
// explicit allowlist.
const eventsEnvSchema = z.object({
  LIVE_EVENTS_ENABLED: z.string().optional(),
  LIVE_EVENTS_ALLOWED_ORIGINS: z.string().default(""),
  LIVE_EVENTS_ORIGIN_HOST_FALLBACK: z.string().optional(),
  WEB_URL: z.string().default(""),
  LIVE_EVENTS_SETTLE_MS: intFrom(2000, 0),
  LIVE_EVENTS_PROJECT_RATE_PER_SEC: intFrom(50),
  LIVE_EVENTS_MAX_SOCKETS: intFrom(500),
  LIVE_EVENTS_MAX_SOCKETS_PER_USER: intFrom(10),
  LIVE_EVENTS_MAX_PROJECTS_PER_SOCKET: intFrom(100),
  LIVE_EVENTS_MAX_PENDING_SOCKETS: intFrom(100),
  LIVE_EVENTS_MAX_SOCKETS_PER_ADDRESS: intFrom(25),
  LIVE_EVENTS_AUTH_TIMEOUT_MS: intFrom(8000),
  LIVE_EVENTS_AUTH_FAIL_CACHE_MS: intFrom(30_000, 0),
  LIVE_EVENTS_TRUSTED_PROXIES: z.string().default(""),
  LIVE_EVENTS_REVALIDATE_MS: intFrom(60_000, 1000),
  LIVE_EVENTS_REVALIDATE_MAX_FAILURES: intFrom(3),
});

// The upstream session lookup is aborted after this long (APIService). The hub's own auth
// timeout is always kept below it so a hung upstream is cut off by the hub first.
export const UPSTREAM_TIMEOUT_MS = 20_000;

export type EventsConfig = {
  enabled: boolean;
  allowedOrigins: string[];
  /** accept an Origin whose scheme and host match the request (opt-in) */
  originHostFallback: boolean;
  webUrl: string;
  settleMs: number;
  projectRatePerSec: number;
  maxSockets: number;
  maxSocketsPerUser: number;
  maxProjectsPerSocket: number;
  maxPendingSockets: number;
  maxSocketsPerAddress: number;
  authTimeoutMs: number;
  authFailCacheMs: number;
  trustedProxies: string[];
  maxMessageBytes: number;
  maxInboundPerSec: number;
  maxBufferedBytes: number;
  coalesceMs: number;
  maxItemsPerFrame: number;
  firstMessageMs: number;
  /** an authenticated socket must send a subscribe within this long */
  subscribeDeadlineMs: number;
  /** project roles are cached per user and workspace for this long (single-flight) */
  rolesCacheMs: number;
  /** subscribe messages per user per second, across all of the user's sockets */
  maxUserSubscribesPerSec: number;
  /** connections seen without a trusted peer before warning that LIVE_EVENTS_TRUSTED_PROXIES never matches */
  trustedProxyWarnAfter: number;
  pingIntervalMs: number;
  maxMissedPongs: number;
  revalidateMs: number;
  revalidateJitter: number;
  revalidateMaxFailures: number;
};

export const EVENTS_CHANNEL_PREFIX = "plane:live-events:";
export const EVENTS_CHANNEL_PATTERN = `${EVENTS_CHANNEL_PREFIX}*`;

export const parseEventsConfig = (source: Record<string, string | undefined> = process.env): EventsConfig => {
  const parsed = eventsEnvSchema.parse(source);
  return {
    enabled: parsed.LIVE_EVENTS_ENABLED === "1",
    allowedOrigins: parsed.LIVE_EVENTS_ALLOWED_ORIGINS.split(","),
    originHostFallback: parsed.LIVE_EVENTS_ORIGIN_HOST_FALLBACK === "1",
    webUrl: parsed.WEB_URL,
    settleMs: parsed.LIVE_EVENTS_SETTLE_MS,
    projectRatePerSec: parsed.LIVE_EVENTS_PROJECT_RATE_PER_SEC,
    maxSockets: parsed.LIVE_EVENTS_MAX_SOCKETS,
    maxSocketsPerUser: parsed.LIVE_EVENTS_MAX_SOCKETS_PER_USER,
    maxProjectsPerSocket: parsed.LIVE_EVENTS_MAX_PROJECTS_PER_SOCKET,
    maxPendingSockets: parsed.LIVE_EVENTS_MAX_PENDING_SOCKETS,
    maxSocketsPerAddress: parsed.LIVE_EVENTS_MAX_SOCKETS_PER_ADDRESS,
    authTimeoutMs: Math.min(parsed.LIVE_EVENTS_AUTH_TIMEOUT_MS, UPSTREAM_TIMEOUT_MS - 1000),
    authFailCacheMs: parsed.LIVE_EVENTS_AUTH_FAIL_CACHE_MS,
    trustedProxies: parsed.LIVE_EVENTS_TRUSTED_PROXIES.split(",")
      .map((v) => v.trim())
      .filter(Boolean),
    maxMessageBytes: 4 * 1024,
    maxInboundPerSec: 5,
    maxBufferedBytes: 256 * 1024,
    coalesceMs: 250,
    maxItemsPerFrame: 500,
    firstMessageMs: 10_000,
    subscribeDeadlineMs: 30_000,
    rolesCacheMs: 8000,
    maxUserSubscribesPerSec: 10,
    trustedProxyWarnAfter: 50,
    pingIntervalMs: 25_000,
    maxMissedPongs: 2,
    revalidateMs: parsed.LIVE_EVENTS_REVALIDATE_MS,
    revalidateJitter: 0.2,
    revalidateMaxFailures: parsed.LIVE_EVENTS_REVALIDATE_MAX_FAILURES,
  };
};
