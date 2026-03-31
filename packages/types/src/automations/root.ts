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

// local imports
import type { TAutomationNodeEdge } from "./edge";
import type { TAutomationNode } from "./node";

export enum EAutomationScope {
  WORK_ITEM = "work-item",
}

export enum EAutomationStatus {
  DRAFT = "draft",
  PUBLISHED = "published",
  DISABLED = "disabled",
}

export enum EAutomationRunStatus {
  PENDING = "pending",
  RUNNING = "running",
  SUCCESS = "success",
  FAILED = "failed",
  CANCELLED = "cancelled",
}

export type TAutomation = {
  average_run_time: number;
  created_at: Date;
  created_by: string;
  description: string | null;
  id: string;
  is_enabled: boolean;
  is_global: boolean;
  last_run_at: Date | null;
  last_run_status: EAutomationRunStatus | null;
  name: string;
  project_ids: string[];
  run_count: number;
  scope: EAutomationScope;
  status: EAutomationStatus;
  total_failed_count: number;
  total_success_count: number;
  updated_at: Date;
  updated_by: string;
  workspace: string;
};

export type TAutomationDetails = TAutomation & {
  nodes: TAutomationNode[];
  edges: TAutomationNodeEdge[];
};
