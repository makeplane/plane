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

/**
 * @overview
 * This step takes the responsibility of updating the project configuration in order
 * to ensure that the project has the necessary settings enabled before we run the import
 */

import { E_FEATURE_FLAGS } from "@plane/constants";
import { logger } from "@plane/logger";
import { createEmptyContext } from "@/apps/jira-server-importer/v2/helpers/ctx";
import type { IStep, TStepExecutionContext, TStepExecutionInput } from "@/apps/jira-server-importer/v2/types";
import { EJiraStep } from "@/apps/jira-server-importer/v2/types";
import { extractJobData } from "@/apps/jira-server-importer/v2/helpers/job";
import { getPlaneFeatureFlagService } from "@/helpers/plane-api-client";
import { extractErrorMetadata } from "@/helpers/errors";
import { executionLog } from "@/lib/execution-log/service/execution-log.service";
import { EExecutionLogLevel, EExecutionLogEntityType } from "@/lib/execution-log/types";
import type { JiraConfig } from "@plane/etl/jira-server";

export type TRequiredFlags = {
  epics: boolean;
  issue_types: boolean;
  issue_worklog: boolean;
};

export class PlaneProjectConfigurationStep implements IStep {
  name = EJiraStep.PLANE_PROJECT_CONFIGURATION;
  dependencies: EJiraStep[] = [];

  async execute(input: TStepExecutionInput): Promise<TStepExecutionContext> {
    const { jobContext } = input;
    const { job, planeClient } = jobContext;

    const { workspace_slug, project_id } = job;

    try {
      const allFeatureFlags = await this.fetchFeatureFlags(workspace_slug, job.initiator_id);
      const requiredFlags = this.collectRequiredFlags(allFeatureFlags);
      const config = job.config as JiraConfig;

      logger.info(`[${job.id.slice(0, 7)}] Project configuration: ${JSON.stringify(requiredFlags)}`, {
        workspace_slug,
        project_id,
        requiredFlags,
      });

      executionLog.collect(job.id, {
        entity_type: EExecutionLogEntityType.PROJECT,
        phase: "FETCH_FEATURE_FLAGS",
        ignore_summarization: true,
        level: EExecutionLogLevel.INFO,
        additional_data: {
          featureFlags: requiredFlags,
        },
      });

      // Set external_source and external_id on the project for cross-project relation lookups.
      // This enables other Jira project imports to find this project by resourceId + projectKey.
      const { resourceId } = extractJobData(job);
      const projectKey = job.config?.project?.key ?? "";

      // Todo, once the features api supports time tracking, we can remove this
      const result = await planeClient.project.update(workspace_slug, project_id, {
        is_time_tracking_enabled: requiredFlags.issue_worklog,
        external_source: job.source,
        external_id: `${resourceId}_${projectKey}`,
      });

      const shouldEnableIssueTypes = requiredFlags.issue_types && !config.importWorkItemTypesGlobally;
      const shouldEnableEpics = requiredFlags.epics && !config.importEpicsAsWorkItems;

      const featureUpdate = await planeClient.project.toggleProjectFeatures(workspace_slug, project_id, {
        epics: shouldEnableEpics,
        modules: true,
        cycles: true,
        work_item_types: shouldEnableIssueTypes,
      });

      // Here the importWorkItemTypesGlobally, also checks for the global
      // work item types being enabled.

      executionLog.collect(job.id, {
        entity_type: EExecutionLogEntityType.PROJECT,
        phase: "UPDATE_PROJECT_CONFIG",
        ignore_summarization: true,
        level: EExecutionLogLevel.SUCCESS,
        additional_data: {
          projectUpdated: {
            is_time_tracking_enabled: requiredFlags.issue_worklog,
            featuresUpdated: {
              epics: shouldEnableEpics,
              modules: true,
              cycles: true,
              work_item_types: shouldEnableIssueTypes,
            },
          },
        },
      });

      logger.info(`[${job.id.slice(0, 7)}] Project configuration updated:`, {
        workspace_slug,
        project_id,
        result,
        featureUpdate,
      });

      return createEmptyContext();
    } catch (error) {
      logger.error(`[${job.id}][${this.name}] Failed to configure project`, error);

      executionLog.collect(job.id, {
        entity_type: EExecutionLogEntityType.PROJECT,
        ignore_summarization: true,
        phase: "UPDATE_PROJECT_CONFIG",

        level: EExecutionLogLevel.ERROR,
        error: extractErrorMetadata(error),
      });

      throw error;
    }
  }

  async fetchFeatureFlags(workspace_slug: string, user_id: string): Promise<Record<string, boolean>> {
    const flaggingService = await getPlaneFeatureFlagService();
    const allFeatureFlags = await flaggingService.getAllFeatureFlags({
      workspace_slug: workspace_slug,
      user_id: user_id,
    });
    return allFeatureFlags;
  }

  collectRequiredFlags(allFeatureFlags: Record<string, boolean>): TRequiredFlags {
    return {
      epics: allFeatureFlags[E_FEATURE_FLAGS.EPICS] || false,
      issue_types: allFeatureFlags[E_FEATURE_FLAGS.ISSUE_TYPES] || false,
      issue_worklog: allFeatureFlags[E_FEATURE_FLAGS.ISSUE_WORKLOG] || false,
    };
  }
}
