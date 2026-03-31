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
import type { EAutomationNodeType, TAutomationNode } from "./node";
import type { EAutomationScope, TAutomation } from "./root";

export type TAutomationActivityKeys = Pick<TAutomation, "name" | "description" | "scope">;
export type TAutomationNodeActivityKeys = Pick<TAutomationNode, "name" | "config" | "handler_name" | "is_enabled">;

export type TAutomationActivityField =
  | "automation"
  | `automation.${keyof TAutomationActivityKeys}`
  | `automation.node.${EAutomationNodeType}`
  | `automation.node.${EAutomationNodeType}.${keyof TAutomationNodeActivityKeys}`
  | "automation.run_history"
  | "project_ids";

export type TAutomationActivityVerb = "created" | "updated" | "deleted" | "removed" | "added";

export type TAutomationRunStatus = "pending" | "running" | "success" | "failed" | "cancelled";

export type TAutomationActivity = {
  actor: string;
  automation: string;
  automation_version: string | null;
  automation_node: string | null;
  automation_edge: string | null;
  automation_run: {
    completed_at: string | null;
    id: string;
    initiator: string;
    started_at: string;
    status: TAutomationRunStatus;
    work_item: string;
    work_item_sequence_id: number;
  } | null;
  automation_scope: EAutomationScope;
  created_at: string | null;
  created_by: string | null;
  epoch: number;
  field: TAutomationActivityField | null;
  id: string;
  new_identifier: string | null;
  new_value: string | null;
  node_execution: string | null;
  old_identifier: string | null;
  old_value: string | null;
  project: string;
  updated_at: string | null;
  updated_by: string | null;
  verb: TAutomationActivityVerb;
  workspace: string;
};

export type TAutomationActivityType = "all" | "activity" | "run_history";

export type TAutomationActivityFilters = {
  show_fails?: boolean;
  type?: TAutomationActivityType;
};
