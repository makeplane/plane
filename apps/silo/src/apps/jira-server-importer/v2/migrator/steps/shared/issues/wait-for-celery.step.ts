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

import { logger } from "@plane/logger";
import { createEmptyContext } from "@/apps/jira-server-importer/v2/helpers/ctx";
import type { IStep, TStepExecutionContext, TStepExecutionInput } from "@/apps/jira-server-importer/v2/types";
import { EJiraStep } from "@/apps/jira-server-importer/v2/types";
import { wait } from "@/helpers/delay";
import { getAPIClientInternal } from "@/services/client";

const MAX_STALE_POLLS = 60; // ~5 min with no progress = timeout
const client = getAPIClientInternal();

/**
 * Extracts stale poll count from previous context state
 */
const extractStalePollCount = (previousContext: TStepExecutionContext | undefined, currentCount: number): number => {
  const lastCount = (previousContext?.state?.lastCompletedCount as number) ?? -1;
  const stalePollCount = (previousContext?.state?.stalePollCount as number) ?? 0;

  const noProgress = lastCount === currentCount && lastCount !== -1;
  return noProgress ? stalePollCount + 1 : 0;
};

export class WaitForCeleryStep implements IStep {
  name = EJiraStep.WAIT_FOR_CELERY;
  dependencies = [];

  async execute(input: TStepExecutionInput): Promise<TStepExecutionContext> {
    const { jobContext, previousContext } = input;

    const report = await client.importReport.getImportReport(jobContext.job.report_id);
    const allBatchesProcessed = report.completed_batch_count >= report.total_batch_count;
    const stalePollCount = extractStalePollCount(previousContext, report.completed_batch_count);

    if (!allBatchesProcessed) {
      // Timeout if stuck
      if (stalePollCount >= MAX_STALE_POLLS) {
        logger.warn(`[${jobContext.job.id}] [${this.name}] Timeout: no progress`, {
          completed: report.completed_batch_count,
          total: report.total_batch_count,
        });
        return createEmptyContext();
      }

      logger.info(`[${jobContext.job.id}] [${this.name}] Waiting for Celery to finish`, {
        completed: report.completed_batch_count,
        total: report.total_batch_count,
      });

      await wait(5000);

      const emptyContext = createEmptyContext();
      return {
        ...emptyContext,
        pageCtx: { ...emptyContext.pageCtx, hasMore: true },
        state: {
          lastCompletedCount: report.completed_batch_count,
          stalePollCount,
        },
      };
    }

    logger.info(`[${jobContext.job.id}] [${this.name}] Celery finished processing all batches`, {
      completed: report.completed_batch_count,
      total: report.total_batch_count,
      imported: report.imported_batch_count,
      errored: report.errored_batch_count,
      totalIssues: report.total_issue_count,
      importedIssues: report.imported_issue_count,
      erroredIssues: report.errored_issue_count,
    });

    return createEmptyContext();
  }
}
