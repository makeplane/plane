/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

const decodeBase64Url = (value: string): string => {
  const base64 = value
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(value.length / 4) * 4, "=");
  const bytes = Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));

  return new TextDecoder().decode(bytes);
};

export const resolveDesktopHandoffRedirect = (searchParams: URLSearchParams, currentOrigin: string): string | null => {
  if (searchParams.get("v") !== "1") return null;

  const encodedOrigin = searchParams.get("o");
  const encodedPath = searchParams.get("p");
  if (!encodedOrigin || !encodedPath) return null;

  try {
    const handoffOrigin = new URL(decodeBase64Url(encodedOrigin)).origin;
    if (handoffOrigin !== currentOrigin) return null;

    const handoffPath = decodeBase64Url(encodedPath);
    const destination = new URL(handoffPath, `${currentOrigin}/`);
    if (!handoffPath.startsWith("/") || destination.origin !== currentOrigin) return null;

    return `${destination.pathname}${destination.search}${destination.hash}`;
  } catch {
    return null;
  }
};
