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

import { pullIssueTypes } from "@plane/etl/jira";
import { logger } from "@plane/logger";
import { createJiraClient } from "@/apps/jira-importer/helpers/migration-helpers";
import type { TJobContext } from "@/apps/jira-server-importer/v2/types";
import { getJobCredentials } from "@/helpers/job";
import { JiraIssueTypesStep } from "../../shared";
import { executionLog } from "@/lib/execution-log/service/execution-log.service";
import { EExecutionLogLevel, EExecutionLogEntityType } from "@/lib/execution-log/types";
import { extractErrorMetadata } from "@/helpers/errors";

export class JiraCloudIssueTypesStep extends JiraIssueTypesStep {
  protected async pull(jobContext: TJobContext, projectId: string, startAt: number) {
    const { job } = jobContext;

    try {
      const credentials = await getJobCredentials(job);
      const client = createJiraClient(job, credentials);
      const result = await pullIssueTypes(client, projectId);

      executionLog.collect(job.id, {
        entity_type: EExecutionLogEntityType.ISSUE_TYPE,
        phase: "PULL_ISSUE_TYPES",
        level: EExecutionLogLevel.INFO,
        metrics: {
          pulled: result.length,
          total: result.length,
        },
      });

      logger.info(`[${jobContext.job.id}] [${this.name}] Pulled issue types from Jira Cloud`, {
        jobId: jobContext.job.id,
        count: result.length,
        hasMore: false,
        startAt,
      });

      return {
        items: result,
        hasMore: false,
        startAt,
        maxResults: result.length,
      };
    } catch (error) {
      logger.error(`[${job.id}][${this.name}] Unable to pull issue types from Jira Cloud`, error);

      executionLog.collect(job.id, {
        entity_type: EExecutionLogEntityType.ISSUE_TYPE,
        phase: "PULL_ISSUE_TYPES",
        level: EExecutionLogLevel.ERROR,
        is_fatal: true,
        error: extractErrorMetadata(error),
      });

      throw error;
    }
  }
}
