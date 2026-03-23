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

import type { IssueTypeDetails } from "jira.js/out/version2/models/index.js";
import { v4 as uuid } from "uuid";
import { E_FEATURE_FLAGS } from "@plane/constants";
import type { E_IMPORTER_KEYS } from "@plane/etl/core";
import type { JiraConfig } from "@plane/etl/jira-server";
import { pullIssueTypesV2, transformIssueType } from "@plane/etl/jira-server";
import { logger } from "@plane/logger";
import type { ExIssueType, ExProject } from "@plane/sdk";
import type { TImportJob } from "@plane/types";
import { withCache } from "@/apps/jira-server-importer/v2/helpers/cache";
import { createEmptyContext, createPaginationContext } from "@/apps/jira-server-importer/v2/helpers/ctx";
import type {
  IStep,
  IStorageService,
  TIssueTypesData,
  TJobContext,
  TStepExecutionContext,
  TStepExecutionInput,
} from "@/apps/jira-server-importer/v2/types";
import { EJiraStep } from "@/apps/jira-server-importer/v2/types";
import { createOrUpdateIssueTypes } from "@/etl/migrator/issue-types/issue-type.migrator";
import { getPlaneFeatureFlagService } from "@/helpers/plane-api-client";
import { protect } from "@/lib";
import { extractErrorMetadata } from "@/helpers/errors";
import { executionLog } from "@/lib/execution-log/service/execution-log.service";
import { EExecutionLogLevel, EExecutionLogEntityType } from "@/lib/execution-log/types";
import { getAPIClientInternal } from "@/services/client";

/**
 * Jira Server Issue Types Step
 * Pulls issue types from Jira Server paginated, transforms to Plane issue types, and pushes
 *
 * Handles Epic types and conflict resolution automatically
 */
export class JiraIssueTypesStep implements IStep {
  name = EJiraStep.ISSUE_TYPES;
  dependencies = [];

  constructor(private readonly source: E_IMPORTER_KEYS.JIRA_SERVER | E_IMPORTER_KEYS.JIRA) {}

  private readonly PAGE_SIZE = 50;

  /**
   * Check if issue types feature is enabled for the workspace and project
   */
  private async shouldExecute(input: TStepExecutionInput): Promise<boolean> {
    const { jobContext } = input;
    const { job, planeClient } = jobContext;

    const config = job.config as JiraConfig;
    const globallyImportWorkItemTypes = config.importWorkItemTypesGlobally ?? false;

    // Ensure if the issue types are enabled for the project or not.
    const featureFlagService = await getPlaneFeatureFlagService();
    const isIssueTypeFeatureEnabled = await withCache(
      "PROJECT_ISSUE_TYPE_FF",
      job,
      async () =>
        await featureFlagService.featureFlags({
          workspace_slug: job.workspace_slug,
          user_id: job.initiator_id,
          flag_key: E_FEATURE_FLAGS.ISSUE_TYPES,
        })
    );

    // Ensure that the current project has issue types enabled.
    const planeProjectDetails = await withCache(
      "PROJECT_CONFIGURATION",
      job,
      async () =>
        await protect<ExProject>(
          planeClient.project.getProject.bind(planeClient.project),
          job.workspace_slug,
          job.project_id
        )
    );

    // Extract the issue types from the plane entities
    const isIssueTypeEnabledForProject = planeProjectDetails.is_issue_type_enabled;
    const enabledForProjectLevel = (isIssueTypeFeatureEnabled && isIssueTypeEnabledForProject) ?? false;

    return enabledForProjectLevel || globallyImportWorkItemTypes;
  }

  async execute(input: TStepExecutionInput): Promise<TStepExecutionContext> {
    const { jobContext, storage, previousContext } = input;
    const { job } = jobContext;

    try {
      // Check if issue types are enabled before proceeding
      const shouldExecute = await this.shouldExecute(input);
      if (!shouldExecute) {
        logger.info(`[${job.id}] [${this.name}] Skipping - issue types not enabled`, {
          jobId: job.id,
        });
        return {
          pageCtx: { startAt: 0, hasMore: false, totalProcessed: 0 },
          results: { pulled: 0, pushed: 0, errors: [] },
        };
      }

      const projectId = job.config?.project?.id;

      if (!projectId) {
        throw new Error("Project ID not found in job config");
      }

      // Fetch what already exists in Plane
      const config = job.config as JiraConfig;
      const epicsAsWorkItems = config.importEpicsAsWorkItems;
      const importWorkItemTypesGlobally = config.importWorkItemTypesGlobally ?? false;

      // Get pagination state
      const startAt = previousContext?.pageCtx.startAt ?? 0;
      const totalProcessed = previousContext?.pageCtx.totalProcessed ?? 0;

      logger.info(`[${jobContext.job.id}] [${this.name}] Starting execution`, {
        jobId: job.id,
        startAt,
        totalProcessed,
      });

      // Pull issue types from Jira Server (paginated)
      const pulled = await this.pull(jobContext, projectId, startAt);

      if (pulled.items.length === 0) {
        logger.info(`[${jobContext.job.id}] [${this.name}] No issue types found`, { jobId: job.id });
        return createEmptyContext();
      }

      // Transform to Plane issue types
      const transformed = this.transform(job, pulled.items, epicsAsWorkItems || false);
      const pushedWorkItemTypes: ExIssueType[] = [];

      // Push to Plane (handles epics, conflicts, create/update)
      if (importWorkItemTypesGlobally) {
        const pushed = await this.pushAtGlobalLevel(jobContext, transformed);
        pushedWorkItemTypes.push(...pushed);
      } else {
        const pushed = await this.pushAtProjectLevel(jobContext, transformed, epicsAsWorkItems || false);
        pushedWorkItemTypes.push(...pushed);
      }

      await this.storeIssueTypeMappings(job, pushedWorkItemTypes, storage);

      return createPaginationContext({
        hasMore: pulled.hasMore,
        startAt: startAt,
        pageSize: this.PAGE_SIZE,
        pulled: pulled.items.length,
        pushed: pushedWorkItemTypes.length,
        totalProcessed: totalProcessed + pulled.items.length,
      });
    } catch (error) {
      logger.error(`[${jobContext.job.id}] [${this.name}] Step failed`, {
        jobId: job.id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Pull one page of issue types from Jira Server
   */
  protected async pull(jobContext: TJobContext, projectId: string, startAt: number) {
    try {
      const result = await pullIssueTypesV2(
        {
          client: jobContext.sourceClient,
          startAt,
          maxResults: this.PAGE_SIZE,
        },
        projectId
      );

      executionLog.collect(jobContext.job.id, {
        entity_type: EExecutionLogEntityType.ISSUE_TYPE,
        phase: "PULL_ISSUE_TYPES",
        level: EExecutionLogLevel.INFO,
        metrics: {
          pulled: result.items.length,
          total: result.total,
        },
      });

      logger.info(`[${jobContext.job.id}] [${this.name}] Pulled issue types from Jira Server`, {
        jobId: jobContext.job.id,
        count: result.items.length,
        hasMore: result.hasMore,
        startAt,
      });

      return result;
    } catch (error) {
      logger.error(`[${jobContext.job.id}][${this.name}] Unable to pull issue types from Jira`, error);

      executionLog.collect(jobContext.job.id, {
        entity_type: EExecutionLogEntityType.ISSUE_TYPE,
        phase: "PULL_ISSUE_TYPES",
        level: EExecutionLogLevel.ERROR,
        error: extractErrorMetadata(error),
        is_fatal: true,
      });

      throw error;
    }
  }

  /**
   * Transform Jira issue types to Plane issue types
   */
  private transform(
    job: TImportJob<JiraConfig>,
    jiraIssueTypes: IssueTypeDetails[],
    epicsAsWorkItems: boolean
  ): Partial<ExIssueType>[] {
    const resourceId = job.config.resource ? job.config.resource.id : uuid();
    const importWorkItemTypesGlobally = job.config.importWorkItemTypesGlobally ?? false;
    const projectId = importWorkItemTypesGlobally ? undefined : job.project_id;

    return jiraIssueTypes.map((issueType) =>
      transformIssueType({ resourceId, projectId, source: this.source }, issueType, epicsAsWorkItems)
    );
  }

  /**
   * Push issue types to Plane and store mappings
   * Orchestrates the create/update flow with epic handling
   */
  private async pushAtProjectLevel(
    jobContext: TJobContext,
    issueTypes: Partial<ExIssueType>[],
    epicsAsWorkItems: boolean
  ): Promise<ExIssueType[]> {
    const existingIssueTypes = await this.fetchExistingIssueTypes(jobContext);
    const defaultIssueType = existingIssueTypes.find((type) => type.is_default);

    // Decide what to create vs update
    const { toCreate, toUpdate, epicIssueType } = this.separateCreateAndUpdate(
      issueTypes,
      existingIssueTypes,
      epicsAsWorkItems || false
    );

    // Create/update issue types
    const [created, updated] = await Promise.all([
      this.putIssueTypesToProject(jobContext, toCreate, "create"),
      this.putIssueTypesToProject(jobContext, toUpdate, "update"),
    ]);

    // Collect all issue types for mapping storage
    const allIssueTypes: ExIssueType[] = [...created, ...updated];

    // Include default type if present
    if (defaultIssueType) {
      allIssueTypes.push(defaultIssueType);
    }

    // Include epic type if present (with mutated external_id/source)
    if (epicIssueType && !epicsAsWorkItems) {
      allIssueTypes.push(epicIssueType);
    }

    return allIssueTypes;
  }

  private async pushAtGlobalLevel(jobContext: TJobContext, issueTypes: Partial<ExIssueType>[]): Promise<ExIssueType[]> {
    const { job } = jobContext;
    const { workspace_slug } = job;
    const apiClient = getAPIClientInternal();
    const chunkSize = 50;
    const allIssueTypes: ExIssueType[] = [];

    logger.info(`[${job.id}] [${this.name}] Starting global bulk operation`, {
      jobId: job.id,
      totalCount: issueTypes.length,
      batchSize: chunkSize,
    });

    for (let i = 0; i < issueTypes.length; i += chunkSize) {
      const chunk = issueTypes.slice(i, i + chunkSize);

      try {
        const response = await apiClient.workItemType.bulkCreateOrUpdateWorkspaceIssueTypes(workspace_slug, chunk);
        allIssueTypes.push(...response.created, ...response.updated);

        executionLog.collect(job.id, {
          entity_type: EExecutionLogEntityType.ISSUE_TYPE,
          phase: "CREATE_ISSUE_TYPES",
          level: EExecutionLogLevel.INFO,
          metrics: {
            imported: response.created.length,
            already_existed: response.updated.length,
            errored: response.errored.length,
          },
        });

        const workItemTypeIds = [...response.created.map((t) => t.id), ...response.updated.map((t) => t.id)].filter(
          Boolean
        );

        const issueTypeAssociation = await apiClient.workItemType.importWorkspaceIssueTypesToProject(
          job.workspace_slug,
          job.project_id,
          {
            work_item_types: workItemTypeIds as string[],
          }
        );

        logger.info(`[${job.id}] [${this.name}] Issue type association`, {
          jobId: job.id,
          chunkSize: chunkSize,
          issueTypeAssociation: issueTypeAssociation,
        });
      } catch (error) {
        logger.error(`[${job.id}][${this.name}] Error in global bulk operation`, {
          jobId: job.id,
          error: error instanceof Error ? error.message : String(error),
        });

        executionLog.collect(job.id, {
          entity_type: EExecutionLogEntityType.ISSUE_TYPE,
          phase: "CREATE_ISSUE_TYPES",
          level: EExecutionLogLevel.ERROR,
          error: extractErrorMetadata(error),
          additional_data: {
            attemptedCount: chunk.length,
          },
        });

        throw error;
      }
    }

    return allIssueTypes;
  }

  /**
   * Fetch existing issue types from Plane
   */
  private async fetchExistingIssueTypes(jobContext: TJobContext): Promise<ExIssueType[]> {
    const { job, planeClient } = jobContext;

    try {
      const existingIssueTypes = await withCache(
        this.name,
        job,
        async () => await planeClient.issueType.fetch(job.workspace_slug, job.project_id)
      );

      executionLog.collect(job.id, {
        entity_type: EExecutionLogEntityType.ISSUE_TYPE,
        phase: "FETCH_EXISTING_ISSUE_TYPES",
        ignore_summarization: true,
        level: EExecutionLogLevel.INFO,
        additional_data: {
          existingIssueTypesCount: existingIssueTypes.length,
          issueTypeNames: existingIssueTypes.map((t) => t.name),
        },
      });

      logger.info(`[${job.id}] [${this.name}] Found existing issue types`, {
        jobId: job.id,
        count: existingIssueTypes.length,
      });

      return existingIssueTypes;
    } catch (error) {
      logger.error(`[${job.id}][${this.name}] Unable to fetch existing issue types from Plane`, error);

      executionLog.collect(job.id, {
        entity_type: EExecutionLogEntityType.ISSUE_TYPE,
        phase: "FETCH_EXISTING_ISSUE_TYPES",
        level: EExecutionLogLevel.ERROR,
        error: extractErrorMetadata(error),
      });

      return [];
    }
  }

  /**
   * Separate issue types into create vs update buckets
   * Handles Epic and Default type special cases
   */
  private separateCreateAndUpdate(
    issueTypes: Partial<ExIssueType>[],
    existingIssueTypes: ExIssueType[],
    shouldCreateEpicType: boolean
  ): { toCreate: Partial<ExIssueType>[]; toUpdate: Partial<ExIssueType>[]; epicIssueType: ExIssueType | null } {
    const epicIssueType = existingIssueTypes.find((type) => type.is_epic);

    const toCreate = issueTypes.filter((issueType) => {
      if (!shouldCreateEpicType) {
        const isEpic = issueType.is_epic;

        if (isEpic) {
          // We need to update the existing epic issue type in order to add the external_id and external_source
          if (epicIssueType) {
            epicIssueType.external_id = issueType.external_id || "";
            epicIssueType.external_source = issueType.external_source || "";
          }

          return false;
        }
      }

      // Check if already exists by external_id
      const existing = existingIssueTypes.find((existing) => existing.external_id === issueType.external_id);
      return !existing;
    });

    const toUpdate = issueTypes
      .filter((issueType) => {
        // Epic: don't include in update flow
        if (!shouldCreateEpicType && issueType.is_epic) {
          return false;
        }

        // Non-epic: update if exists
        const existing = existingIssueTypes.find((existing) => existing.external_id === issueType.external_id);
        return !!existing;
      })
      .map((issueType) => {
        // Map to existing non-epic
        const existing = existingIssueTypes.find((existing) => existing.external_id === issueType.external_id);
        return { id: existing!.id, ...issueType };
      });

    return { toCreate, toUpdate, epicIssueType: epicIssueType || null };
  }

  /**
   * Create or update issue types in Plane
   */
  private async putIssueTypesToProject(
    jobContext: TJobContext,
    issueTypes: Partial<ExIssueType>[],
    method: "create" | "update"
  ): Promise<ExIssueType[]> {
    if (issueTypes.length === 0) return [];
    const { job, planeClient } = jobContext;

    logger.info(`[${job.id}] [${this.name}] Putting Issue Types: ${method} mode`, {
      jobId: job.id,
      count: issueTypes.length,
    });

    try {
      // Summary is collected inside createOrUpdateIssueTypes
      return await createOrUpdateIssueTypes({
        jobId: job.id,
        issueTypes,
        planeClient,
        workspaceSlug: job.workspace_slug,
        projectId: job.project_id,
        method: method,
      });
    } catch (error) {
      logger.error(`[${job.id}][${this.name}] Unable to ${method} issue types`, error);

      executionLog.collect(job.id, {
        entity_type: EExecutionLogEntityType.ISSUE_TYPE,
        phase: method === "create" ? "CREATE_ISSUE_TYPES" : "UPDATE_ISSUE_TYPES",
        level: EExecutionLogLevel.ERROR,
        error: extractErrorMetadata(error),
        additional_data: {
          attemptedCount: issueTypes.length,
        },
      });

      throw error;
    }
  }

  /**
   * Store issue type mappings for this page
   */
  private async storeIssueTypeMappings(
    job: TImportJob,
    issueTypes: ExIssueType[],
    storage: IStorageService
  ): Promise<void> {
    // Store mappings: external_id -> issue_type_id
    const validIssueTypes = issueTypes.filter((type) => type.external_id && type.id);
    const mappings = validIssueTypes.map((type) => ({
      externalId: type.external_id,
      planeId: type.id!,
    }));

    await storage.storeMapping(job.id, this.name, mappings);

    // Store raw issue types data for dependent steps
    const issueTypesData: TIssueTypesData = validIssueTypes.map((type) => ({
      id: type.id!,
      external_id: type.external_id,
      name: type.name || "",
      is_default: type.is_default || false,
      is_epic: type.is_epic || false,
    }));
    await storage.storeData(job.id, this.name, issueTypesData, ["external_id"]);

    logger.info(`[${job.id}] [${this.name}] Stored mappings for page`, {
      jobId: job.id,
      mappingsCount: mappings.length,
    });
  }
}
