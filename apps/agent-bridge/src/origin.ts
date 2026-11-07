/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { IncomingMessage } from "node:http";

/**
 * Cross-site request guard for the chat socket (WebSocket hijacking) and the sign-in endpoints.
 * Both are authenticated by cookie, so a browser page on another origin must not be able to use
 * them. Upgrades and POSTs without an `Origin` header are not from a browser and cannot carry a
 * victim's cookies (the sign-in endpoints also check `Sec-Fetch-Site` for GETs).
 */
/** `value` without trailing slashes (a loop, not a regex, so long inputs stay linear). */
export function trimTrailingSlashes(value: string): string {
  let end = value.length;
  while (end > 0 && value.charCodeAt(end - 1) === 47) end--;
  return value.slice(0, end);
}

export function originAllowed(req: IncomingMessage, allowed: readonly string[]): boolean {
  const origin = req.headers.origin;
  if (!origin) return true;
  const normalized = trimTrailingSlashes(origin);
  if (allowed.length > 0) return allowed.includes(normalized);
  const forwarded = req.headers["x-forwarded-host"];
  const host = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(",")[0]?.trim() || req.headers.host;
  try {
    return Boolean(host) && new URL(normalized).host === host;
  } catch {
    return false;
  }
}
