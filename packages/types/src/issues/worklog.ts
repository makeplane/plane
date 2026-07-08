/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * @description lightweight representation of the member who logged the time,
 * as returned inline on a worklog by the internal API.
 */
export type TIssueWorklogLoggedByDetail = {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string;
  display_name: string;
};

/**
 * @description a single time-tracking entry attached to a work item.
 * `duration` is always expressed in minutes (1..525600).
 */
export type TIssueWorklog = {
  id: string;
  issue: string;
  /** null when the author account was deleted (FK SET_NULL — billing records survive) */
  logged_by: string | null;
  logged_by_detail: TIssueWorklogLoggedByDetail | null;
  duration: number;
  description: string;
  workspace: string;
  project: string;
  external_source: string | null;
  external_id: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
};

/**
 * @description aggregated time logged for a single work item, returned by the
 * project-level `total-worklogs` endpoint. `duration` is in minutes.
 */
export type TIssueWorklogSummary = {
  issue_id: string;
  duration: number;
};

/**
 * @description payload accepted when creating or updating a worklog entry.
 * `duration` is in minutes (1..525600), `description` is optional (<= 5000 chars).
 */
export type TWorklogFormData = {
  duration: number;
  description?: string;
};
