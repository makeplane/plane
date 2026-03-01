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

import type { Node } from "@tiptap/core";
// extensions
import type { InsertImageComponentProps } from "@/extensions/custom-image/types";
// types
import type { TFileHandler } from "@/types";

export enum EAttachmentBlockAttributeNames {
  ID = "id",
  SOURCE = "src",
  FILE_NAME = "data-name",
  FILE_TYPE = "data-file-type",
  FILE_SIZE = "data-file-size",
  PREVIEW = "data-preview",
  ACCEPTED_FILE_TYPE = "data-accepted-file-type",
  STATUS = "status",
}

export enum EAttachmentStatus {
  PENDING = "pending",
  UPLOADING = "uploading",
  UPLOADED = "uploaded",
  DUPLICATING = "duplicating",
  DUPLICATION_FAILED = "duplication-failed",
}

export type TAttachmentBlockAttributes = {
  [EAttachmentBlockAttributeNames.SOURCE]: string | null;
  [EAttachmentBlockAttributeNames.ID]: string | null;
  [EAttachmentBlockAttributeNames.FILE_NAME]: string | null;
  [EAttachmentBlockAttributeNames.FILE_TYPE]: string | null;
  [EAttachmentBlockAttributeNames.FILE_SIZE]: number | string | null;
  [EAttachmentBlockAttributeNames.PREVIEW]: boolean;
  [EAttachmentBlockAttributeNames.ACCEPTED_FILE_TYPE]: string | null;
  [EAttachmentBlockAttributeNames.STATUS]: EAttachmentStatus;
};

export type InsertAttachmentComponentProps = InsertImageComponentProps & {
  preview?: boolean;
  acceptedFileType?: string;
};

export type AttachmentExtensionOptions = {
  checkIfAttachmentExists: TFileHandler["checkIfAssetExists"];
  getAttachmentDownloadSource: TFileHandler["getAssetDownloadSrc"];
  getAttachmentSource: TFileHandler["getAssetSrc"];
  isFlagged: boolean;
  isVideoAttachmentsFlagged?: boolean;
  onClick?: (src?: string) => void;
  restoreAttachment: TFileHandler["restore"];
  uploadAttachment?: TFileHandler["upload"];
  duplicateAttachment?: TFileHandler["duplicate"];
};

export type AttachmentUploadEntity = ({ event: "insert" } | { event: "drop"; file: File }) & {
  hasOpenedFileInputOnce?: boolean;
};
export type AttachmentExtensionStorage = {
  deletedAttachmentSet: Map<string, boolean>;
  fileMap: Map<string, AttachmentUploadEntity>;
  maxFileSize: number;
};

export type AttachmentExtension = Node<AttachmentExtensionOptions, AttachmentExtensionStorage>;
