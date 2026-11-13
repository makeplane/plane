/**
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash, timingSafeEqual } from "crypto";
import type { NextFunction, Request, Response } from "express";
import { env } from "@/env";
// the same key rule as the pages guard
import { isUsableKey } from "./secret-key";
import type { HubStats } from "./hub";

/** The running hub, registered by the events controller so the health controller can read its counters. */
let statsSource: (() => HubStats) | null = null;
export const registerStatsSource = (source: (() => HubStats) | null): void => {
  statsSource = source;
};

export type LiveStats = {
  startedAt: string;
  uptimeSeconds: number;
  eventsEnabled: boolean;
  events: HubStats | null;
};

export const collectStats = (now: number = Date.now()): LiveStats => {
  const uptimeSeconds = Math.floor(process.uptime());
  return {
    startedAt: new Date(now - uptimeSeconds * 1000).toISOString(),
    uptimeSeconds,
    eventsEnabled: statsSource !== null,
    events: statsSource ? statsSource() : null,
  };
};

const sha256 = (value: string): Buffer => createHash("sha256").update(value).digest();

// Proxy headers: a request carrying any of them did not come straight from the internal network.
const PROXY_HEADERS = ["x-forwarded-for", "x-forwarded-host", "forwarded", "x-real-ip"];

/**
 * Internal-only guard for the counters endpoint, same order and status codes as the pages routes:
 * 1. secret not usable -> 503: unset, a known example value or shorter than MIN_KEY_LENGTH (32) characters,
 *    the rule of the pages guard
 * 2. proxy headers present -> 403 (the shared secret must never travel through the public proxy)
 * 3. live shared secret header missing or wrong -> 401, compared on fixed-length digests with timingSafeEqual.
 * Nothing about the request or the secret is logged.
 */
export const requireStatsAccess = (req: Request, res: Response, next: NextFunction): void => {
  const configured = env.LIVE_SERVER_SECRET_KEY;
  if (!isUsableKey(configured)) {
    res.status(503).json({ error: "Service unavailable" });
    return;
  }
  if (PROXY_HEADERS.some((name) => req.headers[name] !== undefined)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const provided = req.headers["live-server-secret-key"];
  const providedKey = typeof provided === "string" ? provided : "";
  if (!timingSafeEqual(sha256(providedKey), sha256(configured))) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
};
