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

export interface FunctionParameter {
  name: string;
  type: string;
  description: string;
  required: boolean;
  defaultValue?: string;
}

export interface ScriptFunction {
  id: string;
  name: string;
  description: string;
  category: string;
  parameters: FunctionParameter[];
  return_type: string;
  code: string;
  usage_example: string;
  is_system: boolean;
}

export interface PlaneEventPayload {
  data: Record<string, unknown>;
  previous_attributes: string | Record<string, unknown>;
}

export interface PlaneEvent {
  timestamp: number;
  publisher: string;
  publisher_instance: string;
  version: string;
  source: string;
  outbox_id: number;
  event_id: string;
  event_type: string;
  entity_type: string;
  entity_id: string;
  payload: PlaneEventPayload;
  workspace_id: string;
  project_id: string;
  initiator_id: string;
  initiator_type: string;
}

export interface AutomationContext {
  automation_id: string;
  automation_run_id: string;
}

export interface AutomationEventInput {
  event: PlaneEvent;
  context: AutomationContext;
}

export interface ExecutionContext {
  workspaceSlug: string;
  event: AutomationEventInput;
  env: Record<string, string | undefined>;
  variables: Record<string, string>;
  allowedDomains: string[];
  code?: string;
  inlineScript?: boolean;
  accessToken: string;
  baseUrl: string;
  functions?: ScriptFunction[];
}
