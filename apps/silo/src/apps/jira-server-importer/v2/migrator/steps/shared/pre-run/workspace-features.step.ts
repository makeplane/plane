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
import { integrationConnectionHelper } from "@/helpers/integration-connection-helper";
import { getPlaneFeatureFlagService } from "@/helpers/plane-api-client";
import { E_FEATURE_FLAGS } from "@plane/constants";
import { logger } from "@plane/logger";

export class WorkspaceFeaturesStep implements IStep {
  name = EJiraStep.WORKSPACE_FEATURES;
  dependencies: EJiraStep[] = [];

  async execute(input: TStepExecutionInput): Promise<TStepExecutionContext> {
    const { jobContext } = input;
    const { job, planeClient } = jobContext;
    const { workspace_slug } = job;

    const featureFlaggingService = await getPlaneFeatureFlagService();
    const isWorkspaceIssueTypesEnabled = await featureFlaggingService.featureFlags({
      workspace_slug: workspace_slug,
      user_id: job.initiator_id,
      flag_key: E_FEATURE_FLAGS.WORKSPACE_WORK_ITEM_TYPES,
    });

    try {
      if (isWorkspaceIssueTypesEnabled) {
        await integrationConnectionHelper.updateImportJob({
          job_id: job.id,
          config: {
            ...job.config,
            importWorkItemTypesGlobally: true,
          },
        });

        const currentFeatures = await planeClient.workspace.getFeatures(workspace_slug);

        if (!currentFeatures.work_item_types) {
          logger.info(`[${job.id.slice(0, 7)}] Enabling workspace work item types feature`, currentFeatures);
          await planeClient.workspace.toggle(workspace_slug, {
            work_item_types: true,
          });
        }
      }

      logger.info(`[${job.id.slice(0, 7)}] Workspace features updated`, {
        workspace_slug,
        isWorkspaceIssueTypesEnabled,
      });
    } catch (error) {
      logger.error(`[${job.id}][${this.name}] Failed to toggle workspace features`, error);
      throw error;
    }

    return createEmptyContext();
  }
}
