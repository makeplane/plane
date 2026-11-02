/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TScheduleUpdate, TScheduleWarning } from "./scheduling";

type TIssueDates = { id: string; start_date?: string | null; target_date?: string | null };

export type TScheduleIssueBody = {
  change: TIssueDates;
  include_successors: boolean;
  dry_run?: boolean;
  mode?: "calendar" | "working";
  pull_earlier?: boolean;
  expected?: TIssueDates[];
};

export type TScheduleResponse = {
  updates: {
    id: string;
    old_start: string | null;
    old_end: string | null;
    new_start: string | null;
    new_end: string | null;
  }[];
  warnings: TScheduleWarning[];
};

export function schedulePreviewFromResponse(data: Partial<TScheduleResponse> | undefined): {
  updates: TScheduleUpdate[];
  warnings: TScheduleWarning[];
} | null {
  if (!data?.updates || !data.warnings) return null;
  return {
    updates: data.updates.map(({ id, old_start, old_end, new_start, new_end }) => ({
      id,
      oldStart: old_start,
      oldEnd: old_end,
      newStart: new_start,
      newEnd: new_end,
    })),
    warnings: data.warnings,
  };
}
