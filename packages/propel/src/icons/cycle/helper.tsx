/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export interface ICycleGroupIcon {
  className?: string;
  color?: string;
  cycleGroup: TCycleGroups;
  height?: string;
  width?: string;
}

export type TCycleGroups = "current" | "upcoming" | "completed" | "draft";

export const CYCLE_GROUP_COLORS: {
  [key in TCycleGroups]: string;
} = {
  current: "#F59E0B",
  upcoming: "#3F76FF",
  completed: "#16A34A",
  draft: "#525252",
};

export const CYCLE_GROUP_I18N_LABELS: {
  [key in TCycleGroups]: string;
} = {
  current: "current",
  upcoming: "common.upcoming",
  completed: "common.completed",
  draft: "project_cycles.status.draft",
};
