/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export type CycleGroup = "current" | "upcoming" | "completed" | "draft";

/** @deprecated Use CycleGroup instead. */
export type TCycleGroups = CycleGroup;

export const CYCLE_GROUP_COLORS: {
  [key in CycleGroup]: string;
} = {
  current: "#F59E0B",
  upcoming: "#3F76FF",
  completed: "#16A34A",
  draft: "#525252",
};

export const CYCLE_GROUP_I18N_LABELS: {
  [key in CycleGroup]: string;
} = {
  current: "current",
  upcoming: "common.upcoming",
  completed: "common.completed",
  draft: "project_cycles.status.draft",
};
