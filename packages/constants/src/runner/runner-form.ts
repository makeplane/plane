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

import type { RunnerScriptFormData } from "@plane/types";
import { ERunnerScriptType } from "@plane/types";

export const DEFAULT_AUTOMATION_SCRIPT_FORM_DATA: RunnerScriptFormData = {
  name: "",
  code: `// Plane Runner Script for Automation
// Type 'Plane.' to see available APIs with full IntelliSense!

export async function main(input: AutomationEventInput, variables: Record<string, string>) {
  const { event, context } = input;
  const workItemId = event.payload.data.id;
  const projectId = event.project_id;
  const workItem = await Plane.workItems.retrieve(workspaceSlug, projectId, workItemId);
  console.log("Work Item:", workItem);
  return { success: true, workItem };
}
`,
  env_variables: [
    {
      key: "",
      value: "",
    },
  ],
  variables: [],
  script_type: ERunnerScriptType.AUTOMATION,
};

export const DEFAULT_WORKFLOW_TRANSITION_SCRIPT_FORM_DATA: RunnerScriptFormData = {
  name: "",
  code: `// Plane Runner Script for Workflow Transition
// Type 'Plane.' to see available APIs with full IntelliSense!

export async function main(input: WorkflowTransitionEventInput, variables: Record<string, string>) {
  const { event, context } = input;
  const workflowTransitionId = context.workflow_transition_id;
  const workflowTransition = await Plane.workflowTransitions.retrieve(workspaceSlug, workflowTransitionId);
  console.log("Workflow Transition:", workflowTransition);
  return { success: true, workflowTransition };
}
`,
  env_variables: [
    {
      key: "",
      value: "",
    },
  ],
  variables: [],
  script_type: ERunnerScriptType.WORKFLOW_TRANSITION,
};

export const DEFAULT_CRON_TRIGGER_SCRIPT_FORM_DATA: RunnerScriptFormData = {
  name: "",
  code: `// Plane Runner Script for Cron Trigger
// Type 'Plane.' to see available APIs with full IntelliSense!

export async function main(variables: Record<string, string>) {
  console.log("Cron Trigger:", variables);
  return { success: true, variables };
}
`,
  env_variables: [
    {
      key: "",
      value: "",
    },
  ],
  variables: [],
  script_type: ERunnerScriptType.CRON_TRIGGER,
};

export const DEFAULT_SCRIPT_FORM_DATA = {
  [ERunnerScriptType.AUTOMATION]: DEFAULT_AUTOMATION_SCRIPT_FORM_DATA,
  [ERunnerScriptType.WORKFLOW_TRANSITION]: DEFAULT_WORKFLOW_TRANSITION_SCRIPT_FORM_DATA,
  [ERunnerScriptType.CRON_TRIGGER]: DEFAULT_CRON_TRIGGER_SCRIPT_FORM_DATA,
};
