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

import { pullIssuesV2 } from "@plane/etl/jira";
import { logger } from "@plane/logger";
import type { TImportJob } from "@plane/types";
import { createJiraClient } from "@/apps/jira-importer/helpers/migration-helpers";
import type { TStepExecutionContext, TJobContext } from "@/apps/jira-server-importer/v2/types";
import { getJobCredentials } from "@/helpers/job";
import { withCache } from "../../../../helpers/cache";
import { buildExternalId } from "../../../../helpers/job";
import { JiraIssuesStep } from "../../shared/issues";
import { executionLog } from "@/lib/execution-log/service/execution-log.service";
import { EExecutionLogLevel, EExecutionLogEntityType } from "@/lib/execution-log/types";
import { extractErrorMetadata } from "@/helpers/errors";
import type { JiraIssueDataExtractor } from "../../shared/issues/extractors/data.extractor";
import { JiraCloudDataExtractor } from "./extractors/data.extractor";

/**
 * Jira Cloud Issues Step
 *
 * Extends JiraServerIssuesStep to use nextPageToken pagination
 * instead of startAt pagination for Jira Cloud API
 */
export class JiraCloudIssuesStep extends JiraIssuesStep {
  /**
   * Override pagination context to use nextPageToken for Jira Cloud
   */
  protected getPaginationContext(previousContext?: TStepExecutionContext) {
    return {
      startAt: 0, // Not used for Cloud pagination
      totalProcessed: previousContext?.pageCtx.totalProcessed ?? 0,
      nextPageToken: previousContext?.state?.nextPageToken as string | undefined,
    };
  }

  protected getDataExtractor(): JiraIssueDataExtractor {
    return new JiraCloudDataExtractor();
  }

  /**
   * Pull paginated issues from Jira Cloud using nextPageToken
   */
  protected async pull(props: {
    jobContext: TJobContext;
    projectKey: string;
    jql?: string;
    paginationCtx: {
      startAt: number;
      totalProcessed: number;
      nextPageToken?: string;
    };
  }) {
    const { job } = props.jobContext;

    try {
      const credentials = await getJobCredentials(job);
      const client = createJiraClient(job, credentials);

      // Get total number of issues first
      const total = await withCache(
        `jira-cloud-issues-total-${props.projectKey}`,
        job,
        async () => await client.getNumberOfIssues(props.projectKey, props.jql)
      );

      const result = await pullIssuesV2(
        {
          client,
          nextPageToken: props.paginationCtx.nextPageToken,
        },
        props.projectKey,
        total,
        undefined,
        props.jql
      );

      executionLog.collect(job.id, {
        entity_type: EExecutionLogEntityType.WORK_ITEM,
        phase: "PULL_ISSUES",
        level: EExecutionLogLevel.INFO,
        metrics: {
          total: result.total,
          pulled: result.items.length,
        },
      });

      logger.info(`[${job.id}] [${this.name}] Pulled issues from Jira Cloud`, {
        jobId: job.id,
        count: result.items.length,
        hasMore: result.hasMore,
        nextPageToken: result.nextPageToken ? "present" : "none",
      });

      return {
        items: result.items as any[],
        hasMore: result.hasMore,
        total: total ?? 0,
        nextPageToken: result.nextPageToken,
      };
    } catch (error) {
      logger.error(`[${job.id}][${this.name}] Unable to pull issues from Jira Cloud`, error);

      executionLog.collect(job.id, {
        entity_type: EExecutionLogEntityType.WORK_ITEM,
        phase: "PULL_ISSUES",
        level: EExecutionLogLevel.ERROR,
        error: extractErrorMetadata(error),
        is_fatal: true,
        additional_data: {
          nextPageToken: props.paginationCtx.nextPageToken,
        },
      });

      throw error;
    }
  }

  /**
   * Build next context with nextPageToken for Jira Cloud pagination
   */
  protected buildNextContext(
    issuesResult: {
      items: any[];
      hasMore: boolean;
      total: number;
      nextPageToken?: string;
    },
    paginationCtx: {
      startAt: number;
      totalProcessed: number;
      nextPageToken?: string;
    },
    pulled: number,
    pushed: number
  ) {
    const newTotalProcessed = paginationCtx.totalProcessed + pulled;

    if (issuesResult.hasMore && issuesResult.nextPageToken) {
      return {
        pageCtx: {
          startAt: 0, // Not used for Cloud
          hasMore: true,
          totalProcessed: newTotalProcessed,
        },
        results: {
          pulled,
          pushed,
          errors: [],
        },
        state: {
          nextPageToken: issuesResult.nextPageToken,
        },
      };
    }

    return {
      pageCtx: {
        startAt: 0,
        hasMore: false,
        totalProcessed: newTotalProcessed,
      },
      results: {
        pulled,
        pushed,
        errors: [],
      },
    };
  }

  /**
   * Override shouldReturnEmpty to check first page correctly for Cloud
   */
  protected shouldReturnEmpty(
    issuesResult: { items: any[]; hasMore: boolean; total: number },
    paginationCtx: {
      startAt: number;
      totalProcessed: number;
      nextPageToken?: string;
    }
  ): boolean {
    // First page in Cloud is when there's no nextPageToken in context
    return issuesResult.items.length === 0 && !paginationCtx.nextPageToken;
  }

  protected extractSprints(job: TImportJob<any>, issue: any): string[] {
    /* We go through the issue fields and find the custom field that matches
     * the definition of a sprint, which should be an array of objects, and
     * each object should contain boardId, name, startDate, endDate, and state
     */

    const isSprintField = (value: any): boolean =>
      Array.isArray(value) &&
      value.length > 0 &&
      value[0].boardId &&
      value[0].name &&
      value[0].startDate &&
      value[0].endDate &&
      value[0].state;

    const config = job.config;
    const resourceId = config.resource?.id || "";
    const projectId = job.project_id || "";

    for (const [fieldKey, fieldValue] of Object.entries(issue.fields)) {
      if (!fieldKey.startsWith("customfield_")) continue;
      if (isSprintField(fieldValue)) {
        // Handle both array and non-array cases
        const sprints = Array.isArray(fieldValue) ? fieldValue : [fieldValue];
        return sprints.map((s: any) => buildExternalId(projectId, resourceId, s.id.toString()));
      }
    }

    return [];
  }
}
