/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Liviere/plane fork: "New" work items (apps/api/plane/liviere/unread).

import type { TIssuePriorities, TStateGroups } from "@plane/types";

export type TNewWorkItem = {
  id: string;
  name: string;
  sequence_id: number;
  priority: TIssuePriorities | null;
  created_at: string;
  project: { id: string; identifier: string; name: string };
  state: { id: string; name: string; group: TStateGroups; color: string } | null;
  created_by: { id: string; display_name: string } | null;
};

export type TNewWorkItemsPage = {
  results: TNewWorkItem[];
  has_more: boolean;
  /** Server time of the response; "Mark all as read" sends it back as `before`. */
  as_of: string;
};

export type TNewWorkItemsCount = {
  total: number;
  by_project: Record<string, number>;
  as_of: string;
};
