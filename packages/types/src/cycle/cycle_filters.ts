/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export type TCycleTabOptions = "active" | "all";

export type TCycleLayoutOptions = "list" | "board" | "gantt";

export type TCycleDisplayFilters = {
  active_tab?: TCycleTabOptions;
  layout?: TCycleLayoutOptions;
};

export type TCycleFilters = {
  end_date?: string[] | null;
  start_date?: string[] | null;
  status?: string[] | null;
};

export type TCycleFiltersByState = {
  default: TCycleFilters;
  archived: TCycleFilters;
};

export type TCycleStoredFilters = {
  display_filters?: TCycleDisplayFilters;
  filters?: TCycleFilters;
};
