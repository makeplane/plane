/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export enum EMathBlockAttributeNames {
  ID = "id",
  LATEX = "data-latex",
}

export type TMathBlockAttributes = {
  [EMathBlockAttributeNames.ID]: string | null;
  [EMathBlockAttributeNames.LATEX]: string;
};

export type TMathBlockExtensionOptions = unknown;
export type TMathBlockExtensionStorage = unknown;
