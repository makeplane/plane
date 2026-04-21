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

import type { TAttachmentPreviewKind } from "./attachment-preview.types";

/** Maximum file size (in bytes) for text preview before falling back. */
export const MAX_TEXT_PREVIEW_BYTES = 5 * 1024 * 1024; // 5 MiB

// SVG is safe here because it is rendered via <img> tag only, which blocks script execution.
// Do NOT render SVG via <object>, <iframe>, or inline <svg> without sanitization.
const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "ico", "avif", "tiff"]);
const VIDEO_EXTENSIONS = new Set(["mp4", "webm", "ogg", "mov"]);
const AUDIO_EXTENSIONS = new Set(["mp3", "wav", "flac", "aac", "m4a", "oga", "weba"]);
const TEXT_EXTENSIONS = new Set([
  "txt",
  "md",
  "json",
  "xml",
  "csv",
  "log",
  "sql",
  "js",
  "ts",
  "jsx",
  "tsx",
  "css",
  "html",
  "yml",
  "yaml",
  "toml",
  "ini",
  "sh",
  "py",
  "rb",
  "go",
  "rs",
  "java",
  "c",
  "cpp",
  "h",
  "hpp",
]);

/**
 * Classify a file extension into a preview kind.
 * Uses extension-based classification because persisted attachment models
 * do not store MIME type.
 */
export function getAttachmentPreviewKind(extension: string): TAttachmentPreviewKind {
  const ext = extension.toLowerCase().replace(/^\./, "");
  if (IMAGE_EXTENSIONS.has(ext)) return "image";
  if (VIDEO_EXTENSIONS.has(ext)) return "video";
  if (AUDIO_EXTENSIONS.has(ext)) return "audio";
  if (ext === "pdf") return "pdf";
  if (TEXT_EXTENSIONS.has(ext)) return "text";
  return "unsupported";
}

/** Whether a preview kind supports inline rendering. */
export function isInlinePreviewSupported(kind: TAttachmentPreviewKind): boolean {
  return kind !== "unsupported";
}

/** Whether a text file can be previewed inline given its extension and size. */
export function canPreviewTextFile(extension: string, size: number): boolean {
  return getAttachmentPreviewKind(extension) === "text" && size <= MAX_TEXT_PREVIEW_BYTES;
}
