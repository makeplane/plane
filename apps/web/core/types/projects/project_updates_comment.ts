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

import type { EIssueCommentAccessSpecifier } from "@plane/constants";
import type {
  TIssueActivityUserDetail,
  TIssueActivityWorkspaceDetail,
  TIssueActivityProjectDetail,
  TIssueActivityIssueDetail,
  JSONContent,
} from "@plane/types";
import type { TProjectUpdateReaction } from "./update_reaction";

export type TProjectUpdatesComment = {
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
  update_reactions: TProjectUpdateReaction[];
};

export type TProjectUpdatesCommentMap = {
  [update_id: string]: string[];
};

export type TProjectUpdatesCommentIdMap = {
  [update_id: string]: string[];
};
