/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { GOD_MODE_URL } from "@plane/constants";

function ensurePathTrailingSlash(url: URL): string {
  if (!url.pathname.endsWith("/")) url.pathname += "/";
  return url.toString();
}

function normalizeFallback(configuredGodModeUrl: string): string {
  if (!configuredGodModeUrl) return configuredGodModeUrl;

  try {
    const url = new URL(configuredGodModeUrl, "http://fallback.invalid");
    if (!url.pathname.endsWith("/")) url.pathname += "/";
    return configuredGodModeUrl.startsWith("/") ? `${url.pathname}${url.search}${url.hash}` : url.toString();
  } catch {
    const [pathAndQuery, hash = ""] = configuredGodModeUrl.split("#", 2);
    const [pathname, query = ""] = pathAndQuery.split("?", 2);
    const normalizedPath = pathname.endsWith("/") ? pathname : `${pathname}/`;
    return `${normalizedPath}${query ? `?${query}` : ""}${hash ? `#${hash}` : ""}`;
  }
}

export function resolveGodModeUrl(currentHref: string | undefined, configuredGodModeUrl: string): string {
  const fallbackUrl = normalizeFallback(configuredGodModeUrl);
  if (!currentHref) return fallbackUrl;

  try {
    const currentUrl = new URL(currentHref);
    const configuredUrl = new URL(configuredGodModeUrl, currentUrl.origin);
    const adminPort = configuredUrl.port || currentUrl.port;

    configuredUrl.protocol = currentUrl.protocol;
    configuredUrl.hostname = currentUrl.hostname;
    configuredUrl.port = adminPort;

    return ensurePathTrailingSlash(configuredUrl);
  } catch {
    return fallbackUrl;
  }
}

export function getGodModeUrl(): string {
  const currentHref = typeof window === "undefined" ? undefined : window.location.href;
  return resolveGodModeUrl(currentHref, GOD_MODE_URL);
}
