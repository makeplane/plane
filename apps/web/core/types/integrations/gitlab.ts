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

import type { TGitlabWorkspaceConnectionData } from "@plane/etl/core";
import type { EConnectionType, GitlabEntityType, IGitlabEntity } from "@plane/etl/gitlab";
import type { IState } from "@plane/sdk";
import type { TWorkspaceEntityConnection, TWorkspaceConnection } from "@plane/types";

// auth types
export type TGitlabWorkspaceConnection = TWorkspaceConnection<object, TGitlabWorkspaceConnectionData>;

export type TGitlabWorkspaceUserConnection = {
  isConnected: boolean;
};

// data types
export type TGitlabRepository = {
  id: number;
  name: string;
  full_name: string;
};

// entity types
export enum E_STATE_MAP_KEYS {
  DRAFT_MR_OPENED = "DRAFT_MR_OPENED",
  MR_OPENED = "MR_OPENED",
  MR_REVIEW_REQUESTED = "MR_REVIEW_REQUESTED",
  MR_READY_FOR_MERGE = "MR_READY_FOR_MERGE",
  MR_MERGED = "MR_MERGED",
  MR_CLOSED = "MR_CLOSED",
}
export type TStateMapKeys = keyof typeof E_STATE_MAP_KEYS;

export type TProjectMap = {
  entityId: string | undefined; // organization id
  projectId: string | undefined;
};

export type TStateMap = {
  [key in TStateMapKeys]: IState | undefined;
};

export type TGitlabEntityConnectionConfig = object & { states: { mergeRequestEventMapping: TStateMap } };

export type TGitlabEntityConnection = TWorkspaceEntityConnection & {
  config: TGitlabEntityConnectionConfig;

  type: keyof typeof EConnectionType;
  entity_data: IGitlabEntity;
  entity_type: GitlabEntityType;

  created_at: string;
  updated_at: string;
};
