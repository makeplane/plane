/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TProjectAnalyticsCount } from "@plane/types";

// Accent used for the progress fill on program-timeline project bars, matching
// the "planned" module status accent (MODULE_STATUS_COLORS.planned) for brand consistency.
export const PROGRESS_ACCENT_COLOR = "#3f76ff";
export const PROGRESS_ACCENT_COLOR_MUTED = "#3f76ff4d"; // ~30% opacity

/**
 * @description derives a project's completion percentage from its analytics counts.
 * @param analytics the project's analytics count data, if loaded
 */
export const getProjectProgressPercentage = (analytics: TProjectAnalyticsCount | undefined): number => {
  if (!analytics?.total_issues) return 0;
  return Math.round(((analytics.completed_issues ?? 0) / analytics.total_issues) * 100);
};
