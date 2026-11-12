/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * Ensures an API request URL has a trailing slash on its path component, preserving
 * the query string and hash. Required by the Django backend's `APPEND_SLASH` behavior
 * — under Kubernetes ingress, requests without a trailing slash can fail instead of
 * 301-redirecting. Intended to be applied by an axios request interceptor so callers
 * do not need to remember to add the slash.
 *
 * Examples:
 *   "/api/foo"             -> "/api/foo/"
 *   "/api/foo/"            -> "/api/foo/"
 *   "/api/foo?x=1"         -> "/api/foo/?x=1"
 *   "/api/foo#frag"        -> "/api/foo/#frag"
 *   "https://h/api/foo"    -> "https://h/api/foo/"
 *   "" | "/"               -> unchanged
 */
export function ensureAPITrailingSlash(url: string): string {
  if (!url) return url;
  const boundary = url.search(/[?#]/);
  const path = boundary === -1 ? url : url.slice(0, boundary);
  const suffix = boundary === -1 ? "" : url.slice(boundary);
  if (!path || path.endsWith("/")) return url;
  return `${path}/${suffix}`;
}

/**
 * Same as `ensureAPITrailingSlash`, but skips absolute URLs whose origin is not this
 * instance's Django `baseURL`. Signed S3/GCS upload URLs go through `APIService` with
 * an empty `baseURL`; slashing them invalidates the signature and 403s the upload.
 */
export function normalizeAPIRequestURL(url: string, baseURL: string): string {
  if (isForeignAbsoluteURL(url, baseURL)) return url;
  return ensureAPITrailingSlash(url);
}

function isForeignAbsoluteURL(url: string, baseURL: string): boolean {
  try {
    const requestUrl = new URL(url);
    if (!baseURL) return true;
    try {
      return requestUrl.origin !== new URL(baseURL).origin;
    } catch {
      return true;
    }
  } catch {
    return false;
  }
}
