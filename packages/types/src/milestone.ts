/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type { TDescription } from "./common";

export type TMilestoneIconVariant =
  | "default"
  | "done"
  | "in_progress"
  | "not_started_yet"
  | "started_no_progress"
  | "custom";

export type TMilestoneProgress = {
  total_items: number;
  completed_items: number;
  cancelled_items: number;
};

export interface TMilestone {
  id: string;
  title: string;
  description?: TDescription;
  target_date: string | null;
  project_id: string;
  workspace_id: string;
  created_by: string | null;
  updated_by: string | null;
  progress: TMilestoneProgress;
}

export interface IMilestoneInstance {
  // observables
  id: string;
  title: string;
  description?: TDescription;
  target_date: string | null;
  project_id: string;
  workspace_id: string;
  progress: TMilestoneProgress;
  work_item_ids: string[];
  // computed
  progress_percentage: number;
  // actions
  updateProgress: (progress: TMilestoneProgress) => void;
  update: (data: Partial<TMilestone>) => void;
}

export type TPublicMilestone = {
  id: string;
  name: string;
  progress: TMilestoneProgress;
};
