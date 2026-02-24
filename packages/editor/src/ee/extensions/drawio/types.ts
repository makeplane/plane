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

import type { Node as ProseMirrorNode } from "@tiptap/core";
import type { Range } from "@tiptap/react";
import type { TFileHandler } from "@/types";

// Core Enums
export enum EDrawioAttributeNames {
  ID = "id",
  IMAGE_SRC = "data-image-src",
  XML_SRC = "data-xml-src",
  MODE = "data-mode",
  STATUS = "status",
}

export enum EDrawioMode {
  DIAGRAM = "diagram",
  BOARD = "board",
}

export enum EDrawioStatus {
  PENDING = "pending",
  UPLOADING = "uploading",
  UPLOADED = "uploaded",
  DUPLICATING = "duplicating",
  DUPLICATION_FAILED = "duplication-failed",
}

export type TDrawioBlockAttributes = {
  [EDrawioAttributeNames.ID]: string | null;
  [EDrawioAttributeNames.IMAGE_SRC]: string | null;
  [EDrawioAttributeNames.XML_SRC]: string | null;
  [EDrawioAttributeNames.MODE]: EDrawioMode;
  [EDrawioAttributeNames.STATUS]: EDrawioStatus;
};

export type InsertDrawioCommandProps = {
  pos?: number | Range;
  mode: EDrawioMode;
};

export type DrawioExtensionOptions = {
  onClick?: () => void;
  isFlagged: boolean;
  getDiagramSrc: TFileHandler["getAssetSrc"];
  getFileContent?: TFileHandler["getFileContent"];
  restoreDiagram: TFileHandler["restore"];
  uploadDiagram: TFileHandler["upload"];
  reuploadDiagram?: TFileHandler["reupload"];
  duplicateDiagram?: TFileHandler["duplicate"];
  logoSpinner?: React.ComponentType;
};

export type DrawioExtensionStorage = {
  posToInsert: { from: number; to: number };
  openDialog: boolean;
};

export type TDrawioExtension = ProseMirrorNode<DrawioExtensionOptions, DrawioExtensionStorage>;
