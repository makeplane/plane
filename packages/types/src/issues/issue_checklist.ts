/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export type TChecklistItemStatus = "to_do" | "in_progress" | "skipped" | "done";

export type TIssueChecklistItemEditableFields = {
  name: string;
  status: TChecklistItemStatus;
  sort_order: number;
};

export type TIssueChecklistItem = TIssueChecklistItemEditableFields & {
  id: string;
  issue: string;
  project: string;
  workspace: string;
  completed_at: string | null;
  completed_by: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string | null;
};

export type TIssueChecklistItemMap = {
  [item_id: string]: TIssueChecklistItem;
};

export type TIssueChecklistItemIdMap = {
  [issue_id: string]: string[];
};
