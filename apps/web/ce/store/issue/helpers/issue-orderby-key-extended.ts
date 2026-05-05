/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TIssue, TIssueOrderByOptions } from "@plane/types";

/**
 * CE-specific mappings for ISSUE_ORDERBY_KEY.
 * Maps CE sort keys to the TIssue FK property they depend on,
 * so the re-sort path knows which property change triggers a re-sort.
 */
export const ISSUE_ORDERBY_KEY_EXTENDED: Partial<Record<TIssueOrderByOptions, keyof TIssue>> = {
  project__name: "project_id",
  "-project__name": "project_id",
  main_task_category__name: "main_task_category_id",
  "-main_task_category__name": "main_task_category_id",
  sub_task_category__name: "sub_task_category_id",
  "-sub_task_category__name": "sub_task_category_id",
};
