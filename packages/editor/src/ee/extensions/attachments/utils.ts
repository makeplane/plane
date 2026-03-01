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

import type { Editor } from "@tiptap/core";
// constants
import { ACCEPTED_ATTACHMENT_MIME_TYPES, ACCEPTED_IMAGE_MIME_TYPES } from "@/constants/config";
// local imports
import { EAttachmentBlockAttributeNames, EAttachmentStatus } from "./types";
import type { TAttachmentBlockAttributes } from "./types";

export const DEFAULT_ATTACHMENT_BLOCK_ATTRIBUTES: TAttachmentBlockAttributes = {
  [EAttachmentBlockAttributeNames.SOURCE]: null,
  [EAttachmentBlockAttributeNames.ID]: null,
  [EAttachmentBlockAttributeNames.FILE_NAME]: null,
  [EAttachmentBlockAttributeNames.FILE_TYPE]: null,
  [EAttachmentBlockAttributeNames.FILE_SIZE]: null,
  [EAttachmentBlockAttributeNames.PREVIEW]: false,
  [EAttachmentBlockAttributeNames.ACCEPTED_FILE_TYPE]: "all",
  [EAttachmentBlockAttributeNames.STATUS]: EAttachmentStatus.PENDING,
};

export const ACCEPTED_VIDEO_MIME_TYPES = [
  "video/mp4",
  "video/mpeg",
  "video/ogg",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-ms-wmv",
];

/**
 * Map of file type strings to their corresponding MIME types arrays
 */
export const FILE_TYPE_TO_MIME_TYPES_MAP: Record<string, string[]> = {
  all: ACCEPTED_ATTACHMENT_MIME_TYPES,
  video: ACCEPTED_VIDEO_MIME_TYPES,
  image: ACCEPTED_IMAGE_MIME_TYPES,
  attachment: ACCEPTED_ATTACHMENT_MIME_TYPES,
};

/**
 * Checks if a given MIME type is a video type
 * @param mimeType - The MIME type to check
 * @returns true if the MIME type is a video type, false otherwise
 */
export const isVideoMimeType = (mimeType: string): boolean => {
  return ACCEPTED_VIDEO_MIME_TYPES.includes(mimeType);
};

/**
 * Converts a file type string to the corresponding MIME types array
 * @param fileType - The file type string (e.g., "all", "video", "image", "attachment")
 * @returns Array of MIME types corresponding to the file type, or default "all" types if null/undefined/invalid
 */
export const getMimeTypesFromFileType = (fileType: string | null | undefined): string[] => {
  if (!fileType) {
    return FILE_TYPE_TO_MIME_TYPES_MAP.all;
  }

  return FILE_TYPE_TO_MIME_TYPES_MAP[fileType] ?? FILE_TYPE_TO_MIME_TYPES_MAP.all;
};

/**
 * Converts a MIME types array to a file type string
 * @param mimeTypes - Array of MIME types
 * @returns File type string ("video", "image", "attachment", or "all")
 */
export const getFileTypeFromMimeTypes = (mimeTypes: string[] | null | undefined): string => {
  if (!mimeTypes || mimeTypes.length === 0) {
    return "all";
  }

  // Check if all mime types are video types
  if (mimeTypes.every((type) => ACCEPTED_VIDEO_MIME_TYPES.includes(type))) {
    return "video";
  }

  // Check if all mime types are image types
  if (mimeTypes.every((type) => ACCEPTED_IMAGE_MIME_TYPES.includes(type))) {
    return "image";
  }

  // Default to all
  return "all";
};

export const getAttachmentExtensionFileMap = (editor: Editor) => editor.storage.attachmentComponent?.fileMap;

export const getAttachmentBlockId = (id: string) => `editor-attachment-block-${id}`;

export const isAttachmentDuplicating = (status: EAttachmentStatus) => status === EAttachmentStatus.DUPLICATING;

export const isAttachmentDuplicationComplete = (status: EAttachmentStatus) =>
  status === EAttachmentStatus.UPLOADED || status === EAttachmentStatus.DUPLICATION_FAILED;

export const hasAttachmentDuplicationFailed = (status: EAttachmentStatus) =>
  status === EAttachmentStatus.DUPLICATION_FAILED;
