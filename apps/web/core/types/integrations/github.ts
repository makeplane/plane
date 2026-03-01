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

import type { TGithubWorkspaceConnectionData } from "@plane/etl/core";
import type { IState } from "@plane/sdk";
import type { TWorkspaceConnection, TWorkspaceEntityConnection } from "@plane/types";

// auth types
export type TGithubWorkspaceConnection = TWorkspaceConnection<object, TGithubWorkspaceConnectionData>;

export type TGithubWorkspaceUserConnection = {
  isConnected: boolean;
};

// data types
export type TGithubRepository = {
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

// entity types
export enum E_ISSUE_STATE_MAP_KEYS {
  ISSUE_OPEN = "ISSUE_OPEN",
  ISSUE_CLOSED = "ISSUE_CLOSED",
}
export type TIssueStateMapKeys = keyof typeof E_ISSUE_STATE_MAP_KEYS;

export type TIssueStateMap = {
  [key in TIssueStateMapKeys]: IState | undefined;
};

export type TProjectMap = {
  entityId: string | undefined; // organization id
  projectId: string | undefined;
};

export type TStateMap = {
  [key in TStateMapKeys]: IState | undefined;
};

export type TGithubEntityConnectionConfig = object & {
  states: { mergeRequestEventMapping?: TStateMap; issueEventMapping?: TIssueStateMap };
  allowBidirectionalSync?: boolean;
};

export type TGithubEntityConnection = TWorkspaceEntityConnection & {
  entity_data: object & {
    id: number;
    name: string;
    full_name: string;
  };

  config: TGithubEntityConnectionConfig;

  created_at: string;
  updated_at: string;
};
