/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

/**
 * Builds a full API URL for SSR fetch calls. Returns null if URL construction fails.
 *
 * In cloud deployments, VITE_API_BASE_URL is set to the full API origin.
 * In self-managed deployments, it is empty because the browser resolves
 * relative URLs against the current hostname. But in SSR (Node.js),
 * there is no browser — so we derive the origin from the incoming
 * request's URL (which comes from the Host header).
 *
 * new URL() can throw on malformed input, so errors are caught internally
 * rather than relying on callers to wrap in try/catch.
 */
export function buildApiUrl(requestUrl: string, endpoint: string): string | null {
  try {
    const base = process.env.VITE_API_BASE_URL || new URL(requestUrl).origin;
    const basePath = process.env.VITE_API_BASE_PATH || "/api";
    return new URL(`${basePath}${endpoint}`, base).href;
  } catch {
    return null;
  }
}

/** Anchor must be alphanumeric, hyphens, or underscores only */
const ANCHOR_REGEX = /^[a-zA-Z0-9_-]+$/;

/**
 * Validates the anchor and builds the API URL in one step.
 * Returns null if the anchor is invalid or URL construction fails.
 */
export function buildAnchorApiUrl(requestUrl: string, anchor: string, path: string): string | null {
  if (!ANCHOR_REGEX.test(anchor)) return null;
  return buildApiUrl(requestUrl, `/public/anchor/${anchor}${path}`);
}
