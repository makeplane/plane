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

// types
import type { TDisplayConfig } from "@/types";

export const DEFAULT_DISPLAY_CONFIG: TDisplayConfig = {
  fontSize: "large-font",
  fontStyle: "sans-serif",
  lineSpacing: "regular",
  wideLayout: false,
};

export const ACCEPTED_IMAGE_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];

export const ACCEPTED_ATTACHMENT_MIME_TYPES = [
  // Images
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/svg+xml",
  "image/webp",
  "image/tiff",
  "image/bmp",
  // Netpbm formats
  "image/x-portable-graymap",
  "image/x-portable-bitmap",
  "image/x-portable-pixmap",
  // Documents
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "application/rtf",
  // ODF formats
  "application/vnd.oasis.opendocument.spreadsheet",
  "application/vnd.oasis.opendocument.text",
  "application/vnd.oasis.opendocument.presentation",
  "application/vnd.oasis.opendocument.graphics",
  "application/vnd.oasis.opendocument.database",
  // Microsoft Visio
  "application/vnd.visio",
  // Audio
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "audio/midi",
  "audio/x-midi",
  "audio/aac",
  "audio/flac",
  "audio/x-m4a",
  // Video
  "video/mp4",
  "video/mpeg",
  "video/ogg",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-ms-wmv",
  // Archives
  "application/zip",
  "application/x-rar",
  "application/x-rar-compressed",
  "application/x-tar",
  "application/gzip",
  "application/x-zip",
  "application/x-zip-compressed",
  "application/x-7z-compressed",
  "application/x-compressed",
  "application/x-compressed-tar",
  "application/x-compressed-tar-gz",
  "application/x-compressed-tar-bz2",
  "application/x-compressed-tar-zip",
  "application/x-compressed-tar-7z",
  "application/x-compressed-tar-rar",
  // 3D Models
  "model/gltf-binary",
  "model/gltf+json",
  "application/octet-stream",
  // Fonts
  "font/ttf",
  "font/otf",
  "font/woff",
  "font/woff2",
  // Other
  "text/css",
  "text/javascript",
  "application/json",
  "text/xml",
  "text/csv",
  "application/xml",
  "application/x-sql",
  "application/x-gzip",
  "text/markdown",
];
