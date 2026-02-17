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
// types
import { EJiraStep } from "@/apps/jira-server-importer/v2/types";
import type { IStep, TStepExecutionContext, TStepExecutionInput } from "@/apps/jira-server-importer/v2/types";
// helpers
import { createEmptyContext } from "@/apps/jira-server-importer/v2/helpers/ctx";
import { integrationConnectionHelper } from "@/helpers/integration-connection-helper";
import { withCache } from "@/apps/jira-server-importer/v2/helpers/cache";
import { getPlaneFeatureFlagService } from "@/helpers/plane-api-client";
import { E_FEATURE_FLAGS } from "@plane/constants";

/**
 * Generates execution summary for a specific job
 */
export class JiraExecutionSummaryStep implements IStep {
  name: EJiraStep = EJiraStep.SUMMARY;
  dependencies: EJiraStep[] = [];
  shouldFail?: boolean = false;

  async shouldExecute(input: TStepExecutionInput): Promise<boolean> {
    const { jobContext } = input;
    const { job } = jobContext;

    const featureFlagService = await getPlaneFeatureFlagService();
    const isImportSummaryEnabled = withCache(
      "IMPORT_SUMMARY_ENABLED",
      job,
      async () =>
        await featureFlagService.featureFlags({
          workspace_slug: job.workspace_slug,
          user_id: job.initiator_id,
          flag_key: E_FEATURE_FLAGS.IMPORT_SUMMARY,
        })
    );

    return isImportSummaryEnabled;
  }

  async execute(input: TStepExecutionInput): Promise<TStepExecutionContext> {
    const shouldExecute = await this.shouldExecute(input);
    if (!shouldExecute) {
      logger.info(`[${input.jobContext.job.id}][SUMMARY] Skipping execution summary generation, disabled`);
      return createEmptyContext();
    }

    const { jobContext } = input;
    const { job } = jobContext;
    const { id: jobId, report_id: reportId } = job;

    try {
      await integrationConnectionHelper.triggerExecutionSummaryGenerationForJob({
        job_id: jobId,
        report_id: reportId,
      });
    } catch (error) {
      logger.error(`[${jobId}][SUMMARY] Error during execution summary generation`, { error });
    }

    // Set up return context
    return createEmptyContext();
  }
}
