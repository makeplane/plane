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

export type RunnerPlatform = "node22";

export type TVariableDefinition = {
  key: string;
  required?: boolean;
};

export type RunnerType = "listeners" | "cron_jobs";

export type CodeType = "code-block";

export interface RunnerScript {
  id: string;
  name: string;
  script_type: ERunnerScriptType;
  description?: string | null;

  workspace_slug: string; // workspace slug

  platform: RunnerPlatform;
  runner_type: RunnerType;

  code: string;
  build?: string | null;

  runner_config?: Record<string, unknown> | null;
  code_type?: CodeType | null;

  allowed_domains?: string[] | null;

  credential?: string | null;

  env_variables?: Record<string, string> | null;

  variables?: TVariableDefinition[] | null;

  created_at: string;
  updated_at: string;

  // Stats (from list endpoint)
  total_executions?: number;
  successful_executions?: number;
  success_rate?: number | null;
  last_run?: string | null;
  is_system?: boolean;
}

export type TJSON = {
  key: string;
  value: string;
};

export type RunnerScriptFormData = {
  name: string;
  code: string;
  env_variables: TJSON[];
  variables: TVariableDefinition[];
  script_type: ERunnerScriptType;
};

export type TRunnerScriptExecution = {
  id: string;
  status: "pending" | "in_progress" | "completed" | "errored";
  input_data: unknown;
  output_data: unknown;
  error_data: {
    message: string;
  };
  created_at: string;
  updated_at: string;
  task: string;
};

export type TRunnerScriptStats = {
  total_tasks: number;
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
  pending_executions: number;
};

export type TRunnerScriptFilters = {
  project_id?: string;
  platform?: RunnerPlatform;
  runner_type?: RunnerType;
};

export enum ERunnerScriptType {
  AUTOMATION = "automation",
  WORKFLOW_TRANSITION = "workflow_transition",
  CRON_TRIGGER = "cron_trigger",
}

export const RUNNER_SCRIPT_TYPE_MAP = {
  [ERunnerScriptType.AUTOMATION]: "Automation",
  [ERunnerScriptType.WORKFLOW_TRANSITION]: "Workflow Transition",
  [ERunnerScriptType.CRON_TRIGGER]: "Cron Trigger",
};
