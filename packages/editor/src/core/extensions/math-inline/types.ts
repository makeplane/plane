/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export enum EMathInlineAttributeNames {
  ID = "id",
  LATEX = "data-latex",
}

export type TMathInlineAttributes = {
  [EMathInlineAttributeNames.ID]: string | null;
  [EMathInlineAttributeNames.LATEX]: string;
};

export type TMathInlineExtensionOptions = unknown;
export type TMathInlineExtensionStorage = unknown;
