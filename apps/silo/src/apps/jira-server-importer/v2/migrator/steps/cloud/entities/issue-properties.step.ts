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

import { pullIssueFields } from "@plane/etl/jira";
import type { JiraIssueField } from "@plane/etl/jira-server";
import { createJiraClient } from "@/apps/jira-importer/helpers/migration-helpers";
import { getJobCredentials } from "@/helpers/job";
import type { TJobContext, TIssueTypesData } from "../../../../types";
import { JiraIssuePropertiesStep } from "../../shared/entities";
import { executionLog } from "@/lib/execution-log/service/execution-log.service";
import { EExecutionLogLevel, EExecutionLogEntityType } from "@/lib/execution-log/types";
import { extractErrorMetadata } from "@/helpers/errors";
import { logger } from "@plane/logger";

export class JiraCloudIssuePropertiesStep extends JiraIssuePropertiesStep {
  protected async pull(
    jobCtx: TJobContext,
    _projectKey: string,
    projectId: string,
    issueTypesData: TIssueTypesData
  ): Promise<JiraIssueField[]> {
    const { job } = jobCtx;

    try {
      const credentials = await getJobCredentials(job);
      const client = createJiraClient(job, credentials);
      const issueTypes = issueTypesData
        .map((type) => {
          const id = type.external_id.split("_").pop();
          if (typeof id !== "string" || id.length === 0) {
            return null;
          }
          return { id, name: type.name };
        })
        .filter((item): item is { id: string; name: string } => item !== null);

      const result = await pullIssueFields(client, issueTypes, projectId);

      executionLog.collect(job.id, {
        entity_type: EExecutionLogEntityType.ISSUE_PROPERTY,
        phase: "PULL_CUSTOM_FIELDS",
        level: EExecutionLogLevel.INFO,
        metrics: {
          pulled: result.length,
          total: result.length,
        },
        additional_data: {
          issueTypesCount: issueTypes.length,
        },
      });

      return result;
    } catch (error) {
      logger.error(`[${job.id}][${this.name}] Unable to pull custom fields from Jira Cloud`, error);

      executionLog.collect(job.id, {
        entity_type: EExecutionLogEntityType.ISSUE_PROPERTY,
        phase: "PULL_CUSTOM_FIELDS",
        level: EExecutionLogLevel.ERROR,
        is_fatal: true,
        error: extractErrorMetadata(error),
      });

      throw error;
    }
  }
}
