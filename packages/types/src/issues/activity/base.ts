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

export * from "./issue_activity";
export * from "./issue_comment";
export * from "./issue_comment_extended";
export * from "./issue_comment_reaction";
export * from "./state-duration";

import type { TIssuePriorities } from "../../issues";

// root types
export type TIssueActivityWorkspaceDetail = {
  name: string;
  slug: string;
  id: string;
};

export type TIssueActivityProjectDetail = {
  id: string;
  identifier: string;
  name: string;
  cover_image: string;
  description: string | null;
  emoji: string | null;
  icon_prop: {
    name: string;
    color: string;
  } | null;
};

export type TIssueActivityIssueDetail = {
  id: string;
  sequence_id: number;
  sort_order: boolean;
  name: string;
  description_html: string;
  priority: TIssuePriorities;
  start_date: string;
  target_date: string;
  is_draft: boolean;
};

export type TIssueActivityUserDetail = {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string;
  is_bot: boolean;
  display_name: string;
};

export type TIssueActivityComment =
  | {
      id: string;
      activity_type: "COMMENT";
      created_at?: string;
    }
  | {
      id: string;
      activity_type: "ACTIVITY";
      created_at?: string;
    }
  | {
      id: string;
      activity_type: "STATE";
      created_at?: string;
    }
  | {
      id: string;
      activity_type: "ASSIGNEE";
      created_at?: string;
    }
  | {
      id: string;
      activity_type: "DEFAULT";
      created_at?: string;
    }
  | {
      id: string;
      activity_type: "WORKLOG";
      created_at?: string;
    }
  | {
      id: string;
      activity_type: "ISSUE_ADDITIONAL_PROPERTIES_ACTIVITY";
      created_at?: string;
    };
