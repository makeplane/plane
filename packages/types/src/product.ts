/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TLogoProps } from "./common";
import type { TStateGroups } from "./state";

export type TWorkItemKind = "task" | "product" | "meeting";

export type TProductIndicator = "completed" | "cancelled" | "overdue" | "at_risk" | "not_started" | "on_track";

export type TProductType = {
  id: string;
  name: string;
  logo_props: TLogoProps;
  color: string;
  sort_order: number;
  is_active: boolean;
  requirements_html: string;
  workspace: string;
};

/** The product part of a work item. The computed fields come with the details of one work item only. */
export type TProductDetail = {
  product_type_id: string;
  owner_id: string | null;
  manual_progress: number | null;
  status_comment: string;
  status_comment_by?: string | null;
  status_comment_at?: string | null;
  closed_at?: string | null;
  total_tasks?: number;
  completed_tasks?: number;
  calculated_progress?: number | null;
  progress?: number | null;
  indicator?: TProductIndicator;
};

export type TProductPayload = Partial<
  Pick<TProductDetail, "product_type_id" | "owner_id" | "manual_progress" | "status_comment">
>;

export type TProductListItem = {
  id: string;
  name: string;
  sequence_id: number;
  project_id: string;
  project_identifier: string;
  portfolio_id: string | null;
  state_id: string;
  state_name: string;
  state_group: TStateGroups;
  start_date: string | null;
  target_date: string | null;
  product_type_id: string;
  owner_id: string | null;
  manual_progress: number | null;
  status_comment: string;
  total_tasks: number;
  completed_tasks: number;
  calculated_progress: number | null;
  progress: number | null;
  indicator: TProductIndicator;
};
