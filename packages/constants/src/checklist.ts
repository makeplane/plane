/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TChecklistItemStatus, TStateGroups } from "@plane/types";

/**
 * Presentation-only mapping from a checklist item's status to a state group,
 * used purely to reuse StateGroupIcon and STATE_GROUPS colours. The database
 * never stores the state group key — "skipped" is not "cancelled", and
 * binding a checklist to StateGroup (a workflow concept with a model behind
 * it) would constrain any future fifth status value.
 */
export const CHECKLIST_ITEM_STATUSES: {
  key: TChecklistItemStatus;
  i18n_label: string;
  stateGroup: TStateGroups;
}[] = [
  {
    key: "to_do",
    i18n_label: "checklist.status.to_do",
    stateGroup: "unstarted",
  },
  {
    key: "in_progress",
    i18n_label: "checklist.status.in_progress",
    stateGroup: "started",
  },
  {
    key: "skipped",
    i18n_label: "checklist.status.skipped",
    stateGroup: "cancelled",
  },
  {
    key: "done",
    i18n_label: "checklist.status.done",
    stateGroup: "completed",
  },
];

export const CHECKLIST_ITEM_STATUS_MAP: Record<TChecklistItemStatus, (typeof CHECKLIST_ITEM_STATUSES)[number]> =
  Object.fromEntries(CHECKLIST_ITEM_STATUSES.map((status) => [status.key, status])) as Record<
    TChecklistItemStatus,
    (typeof CHECKLIST_ITEM_STATUSES)[number]
  >;

/** Statuses excluded from the progress denominator. Currently just "skipped". */
export const CHECKLIST_DENOMINATOR_EXCLUDED_STATUSES: TChecklistItemStatus[] = ["skipped"];
