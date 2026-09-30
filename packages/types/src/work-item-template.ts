/**
 * Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TIssuePriorities } from "./issues";

/**
 * Pre-filled work item fields stored on a template (strict subset of create payload).
 */
export type TWorkItemTemplatePayload = {
  name?: string;
  description_html?: string;
  type_id?: string | null;
  state_id?: string | null;
  priority?: TIssuePriorities | null;
  label_ids?: string[];
  assignee_ids?: string[];
  estimate_point?: string | null;
  cycle_id?: string | null;
  module_ids?: string[] | null;
  start_date?: string | null;
  target_date?: string | null;
};

export type TWorkItemTemplate = {
  id: string;
  name: string;
  description: string;
  payload: TWorkItemTemplatePayload;
  project_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  /** Present when `for_project` query was used. */
  resolved_payload?: TWorkItemTemplatePayload;
};
