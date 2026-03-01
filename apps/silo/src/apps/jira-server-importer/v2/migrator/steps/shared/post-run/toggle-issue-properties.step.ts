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

import { createEmptyContext } from "@/apps/jira-server-importer/v2/helpers/ctx";
import type { IStep, TStepExecutionContext, TStepExecutionInput } from "@/apps/jira-server-importer/v2/types";
import { EJiraStep } from "@/apps/jira-server-importer/v2/types";
import { celeryProducer } from "@/worker";
import { logger } from "@plane/logger";
import { v4 as uuidv4 } from "uuid";

export class JiraToggleIssuePropertiesStep implements IStep {
  name = EJiraStep.TOGGLE_ISSUE_PROPERTIES;
  dependencies = [];
  shouldFail?: boolean | undefined;

  async execute(input: TStepExecutionInput): Promise<TStepExecutionContext> {
    const { jobContext } = input;
    const { job, credentials } = jobContext;

    const { workspace_slug: workspaceSlug, project_id: projectId, id: jobId } = job;
    const { user_id: userId } = credentials;

    if (!projectId) {
      logger.error(`[${jobContext.job.id}] [${this.name}] Project ID not found`, { jobId: job.id });
      return createEmptyContext();
    }

    await celeryProducer.registerTask(
      {
        project_id: projectId,
      },
      workspaceSlug,
      projectId,
      jobId,
      userId,
      uuidv4(),
      "plane.silo.bgtasks.toggle_issue_properties_task.toggle_issue_property_by_usage"
    );

    return createEmptyContext();
  }
}
