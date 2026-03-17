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
 * @deprecated Legacy Next.js compatibility helper. Use React Router's built-in URL handling instead.
 * Ensures that a URL has a trailing slash while preserving query parameters and fragments
 * @param url - The URL to process
 * @returns The URL with a trailing slash added to the pathname (if not already present)
 */
export function ensureTrailingSlash(url: string): string {
  try {
    const fallbackBaseUrl =
      typeof window !== "undefined" && window.location.origin ? window.location.origin : "http://dummy.com";
    // Handle relative URLs by creating a URL object with a fallback base URL
    const urlObj = new URL(url, fallbackBaseUrl);

    // Don't modify root path
    if (urlObj.pathname === "/") {
      return url;
    }

    // Add trailing slash if it doesn't exist
    if (!urlObj.pathname.endsWith("/")) {
      urlObj.pathname += "/";
    }

    // For relative URLs, return just the path + search + hash
    if (url.startsWith("/")) {
      return urlObj.pathname + urlObj.search + urlObj.hash;
    }

    // For absolute URLs, return the full URL
    return urlObj.toString();
  } catch (error) {
    // If URL parsing fails, return the original URL
    console.warn("Failed to parse URL for trailing slash enforcement:", url, error);
    return url;
  }
}
