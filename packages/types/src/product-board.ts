/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TMeetingListItem } from "./meeting";
import type { TProductIndicator } from "./product";
import type { TStateGroups } from "./state";

/** A product on the board. In a closed project without access only the plain fields are given. */
export type TBoardProduct = {
  id: string;
  name: string;
  team_id: string;
  product_type_id: string;
  start_date: string | null;
  target_date: string | null;
  state_id: string;
  state_name: string;
  state_group: TStateGroups;
  progress: number | null;
  indicator: TProductIndicator;
  is_closed: boolean;
  is_limited: boolean;
  can_edit: boolean;
  can_open: boolean;
  // null without access to a closed project
  sequence_id: number | null;
  project_id: string | null;
  project_identifier: string | null;
  project_name: string | null;
  portfolio_id: string | null;
  owner_id: string | null;
  manual_progress: number | null;
  calculated_progress: number | null;
  total_tasks: number | null;
  completed_tasks: number | null;
  status_comment: string | null;
  status_comment_by: string | null;
  status_comment_at: string | null;
};

export type TBoardChanges = Partial<
  Pick<TBoardProduct, "start_date" | "target_date" | "state_id" | "manual_progress" | "status_comment">
>;

export type TBoardState = { id: string; name: string; group: TStateGroups; color: string };

export type TBoardTask = {
  id: string;
  name: string;
  sequence_id: number;
  state_name: string;
  state_group: TStateGroups;
  target_date: string | null;
};

export type TBoardProductDetail = TBoardProduct & {
  description_html?: string;
  tasks?: TBoardTask[];
  meetings?: TMeetingListItem[];
};

export type TBoardPage = { results: TBoardProduct[]; total: number; next_offset: number | null };
