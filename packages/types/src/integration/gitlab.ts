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

import type { TWorkspaceEntityConnection, TWorkspaceConnection } from "../workspace";
import type { TStateMap, TIssueStateMap } from "./common";

export type TGitlabMergeRequestEvent =
  | "DRAFT_MR_OPENED"
  | "MR_OPENED"
  | "MR_REVIEW_REQUESTED"
  | "MR_READY_FOR_MERGE"
  | "MR_MERGED"
  | "MR_CLOSED";

export type TGitlabExState = {
  id: string;
  name: string;
  status?: "to_be_created";
};

// gitlab entity connection config
export type TGitlabEntityConnectionConfig = object & {
  states: {
    mergeRequestEventMapping?: TStateMap;
    issueEventMapping?: TIssueStateMap;
  };
  allowBidirectionalSync?: boolean;
  skipBackwardStateMovement?: boolean;
};

// gitlab workspace connection config
export type TGitlabWorkspaceConnectionConfig = object;

// gitlab app config
export type TGitlabAppConfig = {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  webhookSecret: string;
};

// gitlab workspace connection data
export type TGitlabWorkspaceConnectionData = {
  id: number;
  username: string;
  organization: string;
  login: string;
  name: string;
  state: "active" | "blocked";
  avatar_url: string;
  web_url: string;
  appConfig?: TGitlabAppConfig | undefined;
};

// gitlab workspace connection
export type TGitlabWorkspaceConnection = TWorkspaceConnection<
  TGitlabWorkspaceConnectionConfig,
  TGitlabWorkspaceConnectionData
>;

// gitlab entity connection
export type TGitlabEntityConnection = TWorkspaceEntityConnection<TGitlabEntityConnectionConfig>;

// data types
export type TGitlabRepository = {
  id: number;
  name: string;
  full_name: string;
};

export type TGitlabIssueLinkEntityConnectionConfig = {
  comment_id: string;
};

export type TGitlabIssueLinkEntityConnection = TWorkspaceEntityConnection<TGitlabIssueLinkEntityConnectionConfig>;
