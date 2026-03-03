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
 * File extensions that should be treated as downloadable assets
 */
const ASSET_EXTENSIONS = new Set([
  // Images
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".svg",
  ".ico",
  ".bmp",
  ".tiff",
  ".tif",
  // Documents
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".odt",
  ".ods",
  ".odp",
  ".txt",
  ".rtf",
  ".csv",
  // Archives
  ".zip",
  ".tar",
  ".gz",
  ".rar",
  ".7z",
  // Media
  ".mp3",
  ".mp4",
  ".wav",
  ".avi",
  ".mov",
  ".mkv",
  ".webm",
  // Other
  ".json",
  ".xml",
  ".yaml",
  ".yml",
]);

/**
 * URL path patterns that indicate asset/file endpoints
 */
const ASSET_PATH_PATTERNS = [
  /^\/api\/assets\//,
  /^\/api\/workspaces\/file-assets\//,
  /^\/api\/users\/file-assets\//,
  /\/attachments\/[^/]+\/$/,
];

/**
 * Extracts the file extension from a URL pathname
 * Returns the extension in lowercase (e.g., ".png") or empty string if none
 */
function getFileExtension(pathname: string): string {
  const cleanPath = pathname.split("?")[0].split("#")[0];
  const lastSegment = cleanPath.split("/").pop() ?? "";
  const dotIndex = lastSegment.lastIndexOf(".");

  if (dotIndex === -1) {
    return "";
  }
  if (dotIndex === lastSegment.length - 1) {
    return "";
  }

  return lastSegment.slice(dotIndex).toLowerCase();
}

/**
 * Checks if a URL path matches known asset/file patterns
 * Returns true if the path should trigger a file download
 */
export function isAssetPath(urlOrPath: string): boolean {
  let pathname: string;
  try {
    pathname = urlOrPath.startsWith("http") ? new URL(urlOrPath).pathname : urlOrPath;
  } catch {
    return false;
  }

  if (ASSET_PATH_PATTERNS.some((pattern) => pattern.test(pathname))) {
    return true;
  }

  const extension = getFileExtension(pathname);
  return extension !== "" && ASSET_EXTENSIONS.has(extension);
}
