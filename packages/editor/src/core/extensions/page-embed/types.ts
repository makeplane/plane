/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export enum EPageEmbedAttributeNames {
  ID = "id",
  ENTITY_IDENTIFIER = "entity_identifier",
  PROJECT_IDENTIFIER = "project_identifier",
  WORKSPACE_IDENTIFIER = "workspace_identifier",
}

export type TPageEmbedComponentAttributes = {
  [EPageEmbedAttributeNames.ID]: string | null;
  [EPageEmbedAttributeNames.ENTITY_IDENTIFIER]: string | null;
  [EPageEmbedAttributeNames.PROJECT_IDENTIFIER]: string | null;
  [EPageEmbedAttributeNames.WORKSPACE_IDENTIFIER]: string | null;
};
