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

export type TCycleUpdateStatus =
  | "ON_TRACK"
  | "OFF_TRACK"
  | "AT_RISK"
  | "STARTED"
  | "ENDED"
  | "SCOPE_INCREASED"
  | "SCOPE_DECREASED";

export type TCycleUpdates = {
  cycle: string;
  description: string;
  status: TCycleUpdateStatus;
  parent: string;
  completed_issues: number;
  total_issues: number;
  total_estimate_points: number;
  completed_estimate_points: number;
  delete_at: string;
  created_at: string;
  updated_at: string;
  workspace_id: string;
  project_id: string;
  update_id: string;
  reactions: TCycleUpdateReaction[];
};

export type TCycleUpdateReaction = {
  actor: string;
  updateId: string;
  reaction: string;
  reactionId: string;
};
