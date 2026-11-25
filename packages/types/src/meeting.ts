/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TStateGroups } from "./state";

/** The meeting part of a work item. Times are ISO strings with a timezone. */
export type TMeetingDetail = {
  start_at: string;
  end_at: string;
  organizer_id: string | null;
  location: string;
  outcome_html?: string;
  participant_ids?: string[];
};

export type TMeetingPayload = Partial<TMeetingDetail>;

export type TMeetingListItem = {
  id: string;
  name: string;
  sequence_id: number;
  project_id: string;
  parent_id: string | null;
  state_id: string;
  state_group: TStateGroups;
  start_at: string;
  end_at: string;
  location: string;
  organizer_id: string | null;
};
