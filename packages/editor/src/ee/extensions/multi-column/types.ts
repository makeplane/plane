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

import type { Extension } from "@tiptap/core";
// plane editor imports
import { ADDITIONAL_EXTENSIONS } from "@plane/utils";

// ATTRIBUTE ENUMS
export enum EColumnAttributeNames {
  ID = "id",
  WIDTH = "data-width",
  NODE_TYPE = "data-node-type",
}

export enum EColumnListAttributeNames {
  ID = "id",
}

export enum EColumnListNodeType {
  COLUMN_LIST = "column-list",
  COLUMN = "column",
}

// ATTRIBUTE TYPES
export type TColumnAttributes = {
  [EColumnAttributeNames.ID]: string | null;
  [EColumnAttributeNames.WIDTH]: number;
};

export type TColumnListAttributes = {
  [EColumnListAttributeNames.ID]: string | null;
};

// DEFAULT ATTRIBUTE VALUES
export const DEFAULT_COLUMN_ATTRIBUTES: TColumnAttributes = {
  [EColumnAttributeNames.ID]: null,
  [EColumnAttributeNames.WIDTH]: 1,
};

export const DEFAULT_COLUMN_LIST_ATTRIBUTES: TColumnListAttributes = {
  [EColumnListAttributeNames.ID]: null,
};

// COMMAND OPTION TYPES
export type InsertColumnListCommandOptions = {
  columns?: number;
};

export type SetColumnWidthCommandOptions = {
  width: number;
};

export type ColumnPositionCommandOptions = {
  columnPos?: number;
};

// MAIN MULTI-COLUMN EXTENSION TYPES
export type MultiColumnExtensionOptions = {
  isFlagged: boolean;
};

export type MultiColumnExtensionType = Extension<MultiColumnExtensionOptions>;

// NODE TYPES
export type TMultiColumnNodeType = ADDITIONAL_EXTENSIONS.COLUMN | ADDITIONAL_EXTENSIONS.COLUMN_LIST;

export const MultiColumnPlaceholderExtensionName = "multiColumnPlaceholder";
