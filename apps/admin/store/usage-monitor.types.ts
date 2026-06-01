/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// UI-only types for the God-Mode Usage Monitor page. Response contracts live in
// @plane/types (shared with the service); these stay admin-local because the
// service package cannot import from apps/admin.

export type TUsageGranularity = "day" | "month" | "year";

export type TUsagePreset = "week" | "month" | "3-month" | "custom";

export type TUsageFilters = {
  granularity: TUsageGranularity;
  preset: TUsagePreset;
  // date_from/date_to are resolved client-side from the preset and always sent.
  date_from: string;
  date_to: string;
  workspace_id?: string;
};

export type TUsageMonitorTab = "active-users" | "standard-users" | "departments";
