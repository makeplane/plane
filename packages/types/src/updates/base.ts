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

import type { JSONContent } from "../editor";
import type { EIssueCommentAccessSpecifier, EUpdateEntityType, EUpdateStatus } from "../enums";
import type {
  TIssueActivityIssueDetail,
  TIssueActivityProjectDetail,
  TIssueActivityUserDetail,
  TIssueActivityWorkspaceDetail,
} from "../issues/base";

export type TUpdate = {
  id: string;
  status: EUpdateStatus;
  description: string;
  created_by: string;
  updated_at: string;
  update_reactions: TUpdateReaction[];
  comments_count: number;
  completed_issues: number;
  total_issues: number;
};

// reactions
export type TUpdateReaction = {
  actor: string;
  id: string;
  project: string;
  reaction: string;
};

export type TUpdateReactionMap = {
  [reaction_id: string]: TUpdateReaction;
};

export type TUpdateReactionIdMap = {
  [update_id: string]: { [reaction: string]: string[] };
};

// comments
export type TUpdateComment = {
  id: string;
  workspace: string;
  workspace_detail: TIssueActivityWorkspaceDetail;
  project: string;
  project_detail: TIssueActivityProjectDetail;
  issue: string;
  issue_detail: TIssueActivityIssueDetail;
  actor: string;
  actor_detail: TIssueActivityUserDetail;
  created_at: string;
  updated_at: string;
  created_by: string | undefined;
  updated_by: string | undefined;
  attachments: any[];
  comment_reactions: any[];
  comment_stripped: string;
  description: string;
  comment_json: JSONContent;
  external_id: string | undefined;
  external_source: string | undefined;
  access: EIssueCommentAccessSpecifier;
  update_reactions: TUpdateReaction[];
};

export type TUpdatesCommentMap = {
  [update_id: string]: string[];
};

export type TUpdatesCommentIdMap = {
  [update_id: string]: string[];
};

export type TUpdateEntityType = EUpdateEntityType.EPIC | EUpdateEntityType.PROJECT | EUpdateEntityType.INITIATIVE_EPIC;
