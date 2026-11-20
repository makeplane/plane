/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Close code used for a rejected Origin.
export const CLOSE_ORIGIN = 4403;

const DEFAULT_PORTS: Record<string, string> = { "http:": "80", "https:": "443" };

/** Normalise one origin-like string to `scheme://host[:port]` (lowercase, default port stripped). */
export const normalizeOrigin = (value: string): string | null => {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (url.port === DEFAULT_PORTS[url.protocol]) url.port = "";
    return `${url.protocol}//${url.host}`.toLowerCase();
  } catch {
    return null;
  }
};

/** Split each comma separated entry, trim, drop empties and normalise. */
export const buildAllowlist = (entries: string[]): Set<string> => {
  const out = new Set<string>();
  for (const entry of entries) {
    for (const part of entry.split(",")) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      const normalized = normalizeOrigin(trimmed);
      if (normalized) out.add(normalized);
    }
  }
  return out;
};

const firstHeaderValue = (value: string | string[] | undefined): string => {
  const raw = Array.isArray(value) ? value[0] : value;
  return (raw ?? "").split(",")[0].trim().toLowerCase();
};

const stripDefaultPort = (host: string): string => host.replace(/:(80|443)$/, "");

export type OriginInput = {
  origin: string | string[] | undefined;
  host: string | string[] | undefined;
  forwardedHost: string | string[] | undefined;
  forwardedProto?: string | string[] | undefined;
};

/** The scheme the browser used, as told by the proxy: X-Forwarded-Proto, else plain http. */
const requestScheme = (forwardedProto: string | string[] | undefined): "http:" | "https:" | null => {
  const proto = firstHeaderValue(forwardedProto);
  if (!proto) return "http:";
  if (proto === "https" || proto === "wss") return "https:";
  if (proto === "http" || proto === "ws") return "http:";
  return null;
};

/**
 * Accept when the Origin is in the allowlist. With `hostFallback` (opt-in through
 * LIVE_EVENTS_ORIGIN_HOST_FALLBACK=1) also accept when the Origin's host[:port] equals the first
 * X-Forwarded-Host value (Host when that header is absent) AND its scheme equals the request
 * scheme: the first X-Forwarded-Proto value (a tunnel that hands the proxy plain http still sends
 * X-Forwarded-Proto: https), plain http when that header is absent. A missing Origin or the
 * literal "null" is always rejected.
 */
export const isOriginAllowed = (input: OriginInput, allowlist: Set<string>, hostFallback = false): boolean => {
  const rawOrigin = Array.isArray(input.origin) ? input.origin[0] : input.origin;
  // the literal "null" is not a URL, so normalizeOrigin rejects it below
  if (!rawOrigin) return false;
  const normalized = normalizeOrigin(rawOrigin);
  if (!normalized) return false;
  if (allowlist.has(normalized)) return true;
  if (!hostFallback) return false;

  const scheme = requestScheme(input.forwardedProto);
  if (!scheme || !normalized.startsWith(`${scheme}//`)) return false;
  const requestHost = firstHeaderValue(input.forwardedHost) || firstHeaderValue(input.host);
  if (!requestHost) return false;
  const originHost = normalized.replace(/^https?:\/\//, "");
  return stripDefaultPort(originHost) === stripDefaultPort(requestHost);
};
