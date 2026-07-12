/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * @description a project milestone. `total_issues`/`completed_issues` are
 * backend annotations and may be absent depending on the endpoint.
 * The project reference is returned as `project_id` or `project` depending on
 * the serializer — consumers must handle both.
 */
export type TMilestone = {
  id: string;
  name: string;
  description?: string;
  target_date: string | null;
  sort_order?: number;
  project_id?: string;
  project?: string;
  workspace?: string;
  created_at?: string;
  updated_at?: string;
  // annotated counters (optional)
  total_issues?: number;
  completed_issues?: number;
};

/**
 * @description lightweight work item details optionally expanded inline on a
 * milestone-issue link by the internal API.
 */
export type TMilestoneWorkItem = {
  id: string;
  name?: string;
  sequence_id?: number;
  project_id?: string;
  project?: string;
};

/**
 * @description link between a milestone and a work item. `issue` always holds
 * the work item id after store normalization; `issue_detail` is only present
 * when the API expands the work item inline.
 */
export type TMilestoneIssue = {
  id: string;
  issue: string;
  milestone: string;
  issue_detail?: TMilestoneWorkItem;
  workspace?: string;
  project?: string;
  created_at?: string;
  updated_at?: string;
};

/**
 * @description payload accepted when creating or updating a milestone.
 */
export type TMilestoneFormData = {
  name: string;
  description?: string;
  target_date?: string | null;
};
