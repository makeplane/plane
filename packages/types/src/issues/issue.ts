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

import type { EUpdateStatus } from "../enums";
import type { TIssuePriorities } from "../issues";
import type { TStateGroups } from "../state";
import type { TIssuePublicComment } from "./activity/issue_comment";
import type { TWorkItemExtended, TWorkItemWidgetsExtended } from "./issue-extended";
import type { TIssueAttachment } from "./issue_attachment";
import type { TIssueLink } from "./issue_link";
import type { TIssueReaction, IIssuePublicReaction, IPublicVote } from "./issue_reaction";
import type { TIssueRelationTypes } from "./issue_relation";
import type { TIssuePropertyValues } from "../work-item-types/work-item-property-values";

export enum EIssueLayoutTypes {
  LIST = "list",
  KANBAN = "kanban",
  CALENDAR = "calendar",
  GANTT = "gantt_chart",
  SPREADSHEET = "spreadsheet",
}

export enum EIssueServiceType {
  ISSUES = "issues",
  EPICS = "epics",
  WORK_ITEMS = "work-items",
}

export enum EIssuesStoreType {
  GLOBAL = "GLOBAL",
  PROFILE = "PROFILE",
  TEAM = "TEAM",
  PROJECT = "PROJECT",
  CYCLE = "CYCLE",
  MODULE = "MODULE",
  TEAM_VIEW = "TEAM_VIEW",
  PROJECT_VIEW = "PROJECT_VIEW",
  ARCHIVED = "ARCHIVED",
  ARCHIVED_EPIC = "ARCHIVED_EPIC",
  DEFAULT = "DEFAULT",
  WORKSPACE_DRAFT = "WORKSPACE_DRAFT",
  EPIC = "EPIC",
  TEAM_PROJECT_WORK_ITEMS = "TEAM_PROJECT_WORK_ITEMS",
  INITIATIVE_EPIC = "INITIATIVE_EPIC",
  RELEASE = "RELEASE",
}

export type TBaseIssue = {
  id: string;
  sequence_id: number;
  name: string;
  sort_order: number;

  state_id: string | null;
  priority: TIssuePriorities | null;
  label_ids: string[];
  assignee_ids: string[];
  release_ids: string[];
  estimate_point: string | null;

  sub_issues_count: number;
  attachment_count: number;
  link_count: number;

  project_id: string | null;
  parent_id: string | null;
  cycle_id: string | null;
  module_ids: string[] | null;
  type_id: string | null;

  created_at: string;
  updated_at: string;
  start_date: string | null;
  target_date: string | null;
  completed_at: string | null;
  archived_at: string | null;

  created_by: string;
  updated_by: string;
  last_activity_at: string | null;

  is_draft: boolean;
  is_epic?: boolean;
  is_intake?: boolean;

  // Custom property values (inline from /work-items/ endpoint).
  // Backend returns heterogeneous types; normalized to string[] in the store via normalizePropertyValues().
  property_values?: TIssuePropertyValues;
};

type IssueRelation = {
  id: string;
  name: string;
  project_id: string;
  relation_type: TIssueRelationTypes;
  sequence_id: number;
};

export type TIssue = TBaseIssue &
  TWorkItemExtended & {
    description_html?: string;
    is_subscribed?: boolean;
    parent?: Partial<TBaseIssue>;
    issue_reactions?: TIssueReaction[];
    issue_attachments?: TIssueAttachment[];
    issue_link?: TIssueLink[];
    issue_relation?: IssueRelation[];
    issue_related?: IssueRelation[];
    // tempId is used for optimistic updates. It is not a part of the API response.
    tempId?: string;
    // sourceIssueId is used to store the original issue id when creating a copy of an issue. Used in cloning property values. It is not a part of the API response.
    sourceIssueId?: string;
    state__group?: TStateGroups | null;
    update_status?: EUpdateStatus | undefined;
  };

export type TIssueMap = {
  [issue_id: string]: TIssue;
};

export type TIssueResponseResults =
  | TBaseIssue[]
  | {
      [key: string]: {
        results:
          | TBaseIssue[]
          | {
              [key: string]: {
                results: TBaseIssue[];
                total_results: number;
              };
            };
        total_results: number;
      };
    };

export type TIssuesResponse = {
  grouped_by: string;
  next_cursor: string;
  prev_cursor: string;
  next_page_results: boolean;
  prev_page_results: boolean;
  total_count: number;
  count: number;
  total_pages: number;
  extra_stats: null;
  results: TIssueResponseResults;
  total_results: number;
};

export type TWorkItemMeta = {
  id: string;
  sequence_id: number;
  name: string;
  project_identifier: string;
};

export type TWorkItemsMetaResponse = {
  grouped_by: string | null;
  sub_grouped_by?: string | null;
  next_cursor: string;
  prev_cursor: string;
  next_page_results: boolean;
  prev_page_results: boolean;
  total_count: number;
  count: number;
  total_pages: number;
  extra_stats: null;
  results: TWorkItemMeta[];
  total_results: number;
};

export type TBulkIssueProperties = Pick<
  TIssue,
  | "state_id"
  | "priority"
  | "label_ids"
  | "assignee_ids"
  | "start_date"
  | "target_date"
  | "module_ids"
  | "cycle_id"
  | "estimate_point"
  | "type_id"
>;

export type TBulkOperationsPayload = {
  issue_ids: string[];
  properties: Partial<TBulkIssueProperties>;
};

export type TWorkItemWidgets =
  | "sub-work-items"
  | "dependencies"
  | "relations"
  | "links"
  | "attachments"
  | TWorkItemWidgetsExtended;

export type TIssueServiceType = EIssueServiceType.ISSUES | EIssueServiceType.EPICS | EIssueServiceType.WORK_ITEMS;

export interface IPublicIssue extends Pick<
  TIssue,
  | "description_html"
  | "created_at"
  | "updated_at"
  | "created_by"
  | "id"
  | "name"
  | "priority"
  | "state_id"
  | "project_id"
  | "sequence_id"
  | "sort_order"
  | "start_date"
  | "target_date"
  | "cycle_id"
  | "milestone_id"
  | "module_ids"
  | "label_ids"
  | "assignee_ids"
  | "release_ids"
  | "attachment_count"
  | "sub_issues_count"
  | "link_count"
  | "estimate_point"
  | "type_id"
> {
  comments: TIssuePublicComment[];
  reaction_items: IIssuePublicReaction[];
  vote_items: IPublicVote[];
}

type TPublicIssueResponseResults =
  | IPublicIssue[]
  | {
      [key: string]: {
        results:
          | IPublicIssue[]
          | {
              [key: string]: {
                results: IPublicIssue[];
                total_results: number;
              };
            };
        total_results: number;
      };
    };

export type TPublicIssuesResponse = {
  grouped_by: string;
  next_cursor: string;
  prev_cursor: string;
  next_page_results: boolean;
  prev_page_results: boolean;
  total_count: number;
  count: number;
  total_pages: number;
  extra_stats: null;
  results: TPublicIssueResponseResults;
};

export interface IWorkItemPeekOverview {
  embedIssue?: boolean;
  embedRemoveCurrentNotification?: () => void;
  is_draft?: boolean;
  storeType?: EIssuesStoreType;
}
