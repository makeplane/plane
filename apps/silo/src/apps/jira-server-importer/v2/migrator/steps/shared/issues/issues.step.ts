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

import { v4 as uuidv4 } from "uuid";
import type { E_IMPORTER_KEYS, TIssuePropertyValuesPayload } from "@plane/etl/core";
import type { IJiraIssue, JiraConfig, JiraIssueField } from "@plane/etl/jira-server";
import { pullIssuesV2, transformIssueV2 } from "@plane/etl/jira-server";
import { logger } from "@plane/logger";
import type { ExIssue, ExIssueComment, ExIssueProperty, ExIssuePropertyOption } from "@plane/sdk";
import type { TImportJob } from "@plane/types";
import { createEmptyContext, createPaginationContext } from "@/apps/jira-server-importer/v2/helpers/ctx";
import type {
  IStep,
  IStorageService,
  TIssuePropertiesData,
  TIssueRelationsData,
  TIssuesAssociationsData,
  TIssueTypesData,
  TJobContext,
  TKnownFieldMapping,
  TStepExecutionContext,
  TStepExecutionInput,
} from "@/apps/jira-server-importer/v2/types";
import { E_ADDITIONAL_STORAGE_KEYS, EJiraStep } from "@/apps/jira-server-importer/v2/types";
import { generateIssuePayloadV2 } from "@/etl/migrator/issues.migrator";
import { getAPIClientInternal } from "@/services/client";
import type { BulkIssuePayload } from "@/types";
import { celeryProducer } from "@/worker";
import { extractErrorMetadata } from "@/helpers/errors";
import { executionLog } from "@/lib/execution-log/service/execution-log.service";
import { EExecutionLogLevel, EExecutionLogEntityType } from "@/lib/execution-log/types";
import { JiraIssueDataExtractor } from "./extractors/data.extractor";
import { KNOWN_CUSTOM_FIELDS } from "@/apps/jira-server-importer/v2/helpers/constants";

/**
 * Jira Server Issues Step
 *
 * Pulls issues paginated with comments and property values
 * Processes attachments inline, resolves all entities
 * Uses existing transform functions for proper data conversion
 * Strips parent/cycles/modules → stored as relations for later
 *
 * Dependencies:
 * - issue_properties (provides properties + rawFields for property value transformation)
 * - issue_property_options (provides options)
 *
 * NOT dependencies (accessed via storage.lookupMapping):
 * - users, labels, issue_types
 */
export class JiraIssuesStep implements IStep {
  name = EJiraStep.ISSUES;

  dependencies = [
    EJiraStep.ISSUE_TYPES, // Provides issue types
    EJiraStep.ISSUE_PROPERTIES, // Provides properties + rawFields
    EJiraStep.ISSUE_PROPERTY_OPTIONS, // Provides options
  ];

  constructor(private readonly source: E_IMPORTER_KEYS.JIRA_SERVER | E_IMPORTER_KEYS.JIRA) {}

  private readonly PAGE_SIZE = 50;

  async execute(input: TStepExecutionInput): Promise<TStepExecutionContext> {
    const { jobContext, storage, previousContext, dependencyData } = input;
    const { job } = jobContext;

    try {
      const projectKey = this.getProjectKey(job);
      const jql = this.getJQL(job);
      const paginationCtx = this.getPaginationContext(previousContext);

      logger.info(`[${job.id}] [${this.name}] Starting execution`, {
        jobId: job.id,
        ...paginationCtx,
      });

      // Get all necessary metadata for extraction (from dependencies and storage)
      const { propertyData, additionalData } = await this.getExtractionMetadata(job, storage, dependencyData);

      // Pull paginated issues from Jira
      const issuesResult = await this.pull({
        jobContext,
        projectKey,
        jql,
        paginationCtx,
      });

      await this.initializeReportBatchCount(paginationCtx, issuesResult.total, job);

      if (this.shouldReturnEmpty(issuesResult, paginationCtx)) {
        logger.info(`[${job.id}] [${this.name}] No issues found`, {
          jobId: job.id,
        });
        return createEmptyContext();
      }

      // Process issues: extract comments, property values, associations, and relations using orchestrator
      const dataExtractor = this.getDataExtractor();
      const extractedData = await dataExtractor.extractAll({
        job,
        sourceClient: jobContext.sourceClient,
        source: this.source,
        issues: issuesResult.items,
        propertyData,
        additionalData,
      });

      const { processedIssues, comments, propertyValues, associations, relations } = {
        processedIssues: extractedData.issues,
        comments: extractedData.comments,
        propertyValues: extractedData.propertyValues,
        associations: extractedData.associations,
        relations: extractedData.relations,
      };

      // Load entity mappings from storage
      const mappings = await this.loadMappings(job, processedIssues, associations, storage);

      // Transform issues (uses existing transformIssue function)
      const transformed = await this.transform(job, processedIssues, additionalData.knownCustomFieldMapping);

      // Generate payload and send to Celery
      const pushed = await this.push(
        transformed,
        comments,
        propertyValues,
        mappings,
        associations,
        propertyData,
        jobContext
      );

      // Store relations for Relations Step
      await this.storeRelations(relations, storage, job.id);

      logger.info(`[${job.id}] [${this.name}] Completed page`, {
        jobId: job.id,
        issues: processedIssues.length,
        comments: comments.length,
        pushed: pushed.length,
      });

      return this.buildNextContext(issuesResult, paginationCtx, processedIssues.length, pushed.length);
    } catch (error) {
      logger.error(`[${job.id}] [${this.name}] Step failed`, {
        jobId: job.id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  protected getDataExtractor(): JiraIssueDataExtractor {
    return new JiraIssueDataExtractor();
  }

  /**
   * Extract pagination state from previous context
   * Override this in subclasses to support different pagination strategies
   * (e.g., nextPageToken for Jira Cloud)
   */
  protected getPaginationContext(previousContext?: TStepExecutionContext) {
    return {
      startAt: previousContext?.pageCtx.startAt ?? 0,
      totalProcessed: previousContext?.pageCtx.totalProcessed ?? 0,
    };
  }

  /**
   * Extract and validate project key from job configuration
   */
  protected getProjectKey(job: TImportJob<JiraConfig>): string {
    const projectKey = job.config?.project?.key;
    if (!projectKey) {
      throw new Error("Project key not found in job config");
    }
    return projectKey;
  }

  protected getJQL(job: TImportJob<JiraConfig>): string | undefined {
    return job.config?.jql;
  }

  /**
   * Initialize report batch count on first page
   */
  protected async initializeReportBatchCount(
    paginationCtx: { startAt: number; totalProcessed: number },
    totalIssues: number | undefined,
    job: TImportJob<JiraConfig>
  ): Promise<void> {
    // Only initialize on first page
    if (paginationCtx.startAt !== 0 || !totalIssues) return;

    const totalBatches = Math.ceil(totalIssues / this.PAGE_SIZE);

    const apiClient = getAPIClientInternal();
    await apiClient.importReport.updateImportReport(job.report_id, {
      total_batch_count: totalBatches,
    });

    logger.info(`[${job.id}] [${this.name}] Initialized report batch count`, {
      jobId: job.id,
      totalIssues,
      pageSize: this.PAGE_SIZE,
      totalBatches,
    });
  }

  /**
   * Check if step should return empty context
   */
  protected shouldReturnEmpty(
    issuesResult: { items: IJiraIssue[]; hasMore: boolean; total: number },
    paginationCtx: { startAt: number; totalProcessed: number }
  ): boolean {
    return issuesResult.items.length === 0 && paginationCtx.startAt === 0;
  }

  /**
   * Build the next context based on pagination state
   * Override this in subclasses to support different pagination strategies
   */
  protected buildNextContext(
    issuesResult: { items: IJiraIssue[]; hasMore: boolean; total: number },
    paginationCtx: { startAt: number; totalProcessed: number },
    pulled: number,
    pushed: number
  ): TStepExecutionContext {
    return createPaginationContext({
      hasMore: issuesResult.hasMore,
      startAt: paginationCtx.startAt,
      pageSize: this.PAGE_SIZE,
      pulled,
      pushed,
      totalProcessed: paginationCtx.totalProcessed + pulled,
    });
  }

  /**
   * Pull paginated issues from Jira
   * Override this in subclasses to customize issue fetching behavior
   * (e.g., use nextPageToken for Jira Cloud)
   */
  protected async pull(props: {
    jobContext: TJobContext;
    projectKey: string;
    jql: string | undefined;
    paginationCtx: { startAt: number; totalProcessed: number };
  }): Promise<{
    items: IJiraIssue[];
    hasMore: boolean;
    total: number;
  }> {
    try {
      const issuesResult = await pullIssuesV2(
        {
          client: props.jobContext.sourceClient,
          startAt: props.paginationCtx.startAt,
          maxResults: this.PAGE_SIZE,
        },
        props.projectKey,
        undefined,
        props.jql
      );

      executionLog.collect(props.jobContext.job.id, {
        entity_type: EExecutionLogEntityType.WORK_ITEM,
        phase: "PULL_ISSUES",
        level: EExecutionLogLevel.INFO,
        metrics: {
          total: issuesResult.total,
          pulled: issuesResult.items.length,
        },
      });

      logger.info(`[${props.jobContext.job.id}] [${this.name}] Pulled issues`, {
        jobId: props.jobContext.job.id,
        count: issuesResult.items.length,
        hasMore: issuesResult.hasMore,
        startAt: props.paginationCtx.startAt,
      });

      return {
        items: issuesResult.items,
        hasMore: issuesResult.hasMore,
        total: issuesResult.total ?? 0,
      };
    } catch (error) {
      logger.error(`[${props.jobContext.job.id}][${this.name}] Unable to pull issues from Jira`, error);

      executionLog.collect(props.jobContext.job.id, {
        entity_type: EExecutionLogEntityType.WORK_ITEM,
        phase: "PULL_ISSUES",

        level: EExecutionLogLevel.ERROR,
        error: extractErrorMetadata(error),
        is_fatal: true,
      });

      throw error;
    }
  }

  /**
   * Get all extraction metadata (properties from dependencies, raw fields from storage)
   */
  private async getExtractionMetadata(
    job: TImportJob<JiraConfig>,
    storage: IStorageService,
    dependencyData: Record<string, any> | undefined
  ): Promise<{
    propertyData: {
      issueTypes: TIssueTypesData;
      planeIssueProperties: ExIssueProperty[];
      planeIssuePropertiesOptions: ExIssuePropertyOption[];
    };
    additionalData: {
      rawFields: JiraIssueField[];
      knownCustomFieldMapping: TKnownFieldMapping[];
    };
  }> {
    // 1. Get Property Data from dependencies
    let propertyData = {
      issueTypes: [] as TIssueTypesData,
      planeIssueProperties: [] as ExIssueProperty[],
      planeIssuePropertiesOptions: [] as ExIssuePropertyOption[],
    };

    if (dependencyData) {
      const issueTypes = dependencyData[EJiraStep.ISSUE_TYPES] as TIssueTypesData;
      const propertiesData = dependencyData[EJiraStep.ISSUE_PROPERTIES] as TIssuePropertiesData;
      const optionsData = dependencyData[EJiraStep.ISSUE_PROPERTY_OPTIONS];

      propertyData = {
        issueTypes: issueTypes || [],
        planeIssueProperties: (propertiesData as ExIssueProperty[]) || [],
        planeIssuePropertiesOptions: (optionsData as ExIssuePropertyOption[]) || [],
      };

      logger.info(`[${job.id}] [getExtractionMetadata] propertyData loaded`, {
        issueTypes: propertyData.issueTypes.length,
        properties: propertyData.planeIssueProperties.length,
        options: propertyData.planeIssuePropertiesOptions.length,
      });
    }

    // 2. Get Additional Data from storage
    const [rawFields, knownCustomFieldMapping] = await Promise.all([
      storage.retrieveData<JiraIssueField[]>(job.id, E_ADDITIONAL_STORAGE_KEYS.JIRA_RAW_FIELDS),
      storage.retrieveData<TKnownFieldMapping[]>(job.id, E_ADDITIONAL_STORAGE_KEYS.JIRA_KNOWN_FIELD_MAPPING),
    ]);

    return {
      propertyData,
      additionalData: {
        rawFields: rawFields ?? [],
        knownCustomFieldMapping: knownCustomFieldMapping ?? [],
      },
    };
  }

  /**
   * Load entity mappings from storage
   * (users, labels, issue_types accessed via storage, NOT dependencies)
   */
  private async loadMappings(
    job: TImportJob<JiraConfig>,
    issues: IJiraIssue[],
    associations: TIssuesAssociationsData,
    storage: IStorageService
  ): Promise<{
    userMap: Map<string, string>;
    issueTypeMap: Map<string, string>;
    cycleMap: Map<string, string>;
    moduleMap: Map<string, string>;
  }> {
    const jobId = job.id;
    const resourceId = job.config.resource ? job.config.resource.id : uuidv4();
    const projectId = job.project_id;
    // Extract all external IDs we need to resolve
    const labelNames = new Set<string>();
    const issueTypeIds = new Set<string>();
    const sprintExternalIds = new Set<string>();
    const componentExternalIds = new Set<string>();

    for (const issue of issues) {
      // Labels
      issue.fields.labels?.forEach((label) => labelNames.add(label));

      // Issue types
      if (issue.fields.issuetype?.id) {
        const issueTypeExternalId = `${projectId}_${resourceId}_${issue.fields.issuetype.id}`;
        issueTypeIds.add(issueTypeExternalId);
      }

      associations.cycles.forEach((cycleExternalIds) =>
        cycleExternalIds.forEach((cycleExternalId) => sprintExternalIds.add(cycleExternalId))
      );
      associations.modules.forEach((moduleExternalIds) =>
        moduleExternalIds.forEach((moduleExternalId) => componentExternalIds.add(moduleExternalId))
      );
    }

    // Load mappings in parallel from storage
    const [userMap, issueTypeMap, cycleMap, moduleMap] = await Promise.all([
      // We are retrieving all users instead of associated users, as there can be custom fields that associates with users, and we can't select those
      storage.retrieveMapping(jobId, EJiraStep.USERS),
      storage.lookupMapping(jobId, EJiraStep.ISSUE_TYPES, Array.from(issueTypeIds)),
      storage.lookupMapping(jobId, EJiraStep.CYCLES, Array.from(sprintExternalIds)),
      storage.lookupMapping(jobId, EJiraStep.MODULES, Array.from(componentExternalIds)),
    ]);

    executionLog.collect(jobId, {
      entity_type: EExecutionLogEntityType.WORK_ITEM,
      phase: "LOAD_MAPPINGS",
      level: EExecutionLogLevel.INFO,
      additional_data: {
        loadedUsers: userMap.size,
        loadedIssueTypes: issueTypeMap.size,
        loadedCycles: cycleMap.size,
        loadedModules: moduleMap.size,
      },
    });

    logger.info(`[${jobId}] [${this.name}] Loaded mappings`, {
      jobId,
      users: userMap.size,
      issueTypes: issueTypeMap.size,
    });

    return { userMap, issueTypeMap, cycleMap, moduleMap };
  }

  /**
   * Transform Jira issues to Plane issues
   * Uses existing transformIssue function
   */
  private async transform(
    job: TImportJob<JiraConfig>,
    issues: IJiraIssue[],
    knownCustomFieldMapping: TKnownFieldMapping[]
  ): Promise<Partial<ExIssue>[]> {
    const resourceId = job.config?.resource?.id || "";
    const resourceUrl = job.config?.resource?.url || "";
    const stateMapping = job.config?.state || {};
    const priorityMapping = job.config?.priority || {};
    const startDateField = knownCustomFieldMapping?.find((field) => field.data.name === KNOWN_CUSTOM_FIELDS.START_DATE)
      ?.data?.id;
    const completionDateField = knownCustomFieldMapping?.find(
      (field) => field.data.name === KNOWN_CUSTOM_FIELDS.COMPLETION_DATE
    )?.data?.id;

    const transformed = issues.map((issue) =>
      transformIssueV2(
        { resourceId, projectId: job.project_id, source: this.source },
        issue,
        resourceUrl,
        stateMapping,
        priorityMapping,
        {
          startDate: startDateField,
          completionDate: completionDateField,
        }
      )
    );

    return transformed;
  }

  /**
   * Extract all relations as external IDs
   * Single unified structure for Relations Step
   */

  /**
   * Generate BulkIssuePayload and send to Celery
   * Uses generateIssuePayloadV2 to process attachments and resolve all entities
   */
  private async push(
    issues: Partial<ExIssue>[],
    comments: Partial<ExIssueComment>[],
    propertyValues: TIssuePropertyValuesPayload,
    mappings: {
      userMap: Map<string, string>;
      issueTypeMap: Map<string, string>;
      cycleMap: Map<string, string>;
      moduleMap: Map<string, string>;
    },
    associations: TIssuesAssociationsData,
    propertyData: {
      planeIssueProperties: ExIssueProperty[];
      planeIssuePropertiesOptions: ExIssuePropertyOption[];
    },
    jobContext: TJobContext
  ): Promise<BulkIssuePayload[]> {
    const { job, credentials, planeClient } = jobContext;

    // Generate complete BulkIssuePayload (summary collected inside)
    const bulkPayload: BulkIssuePayload[] = await generateIssuePayloadV2({
      jobId: job.id,
      issues: issues as ExIssue[],
      issueComments: comments as ExIssueComment[],
      credentials,
      planeClient,
      workspaceSlug: job.workspace_slug,
      userMap: mappings.userMap,
      issueTypeMap: mappings.issueTypeMap,
      associations,
      cycleMap: mappings.cycleMap,
      moduleMap: mappings.moduleMap,
      planeIssueProperties: propertyData.planeIssueProperties,
      planeIssuePropertiesOptions: propertyData.planeIssuePropertiesOptions,
      planeIssuePropertyValues: propertyValues,
    });

    const payload = {
      issues: bulkPayload,
      isLastBatch: false,
    };

    try {
      await celeryProducer.registerTask(
        payload,
        job.workspace_slug,
        job.project_id,
        job.id,
        credentials.user_id,
        uuidv4(),
        "plane.bgtasks.data_import_task.import_data"
      );

      const totalComments = bulkPayload.reduce((sum, i) => sum + i.comments.length, 0);
      const totalPropertyValues = bulkPayload.reduce((sum, i) => sum + i.issue_property_values.length, 0);
      const issuesWithAttachments = bulkPayload.filter((i) => i.attachments && i.attachments.length > 0).length;
      const totalAttachments = bulkPayload.reduce((sum, i) => sum + (i.attachments?.length || 0), 0);

      executionLog.collect(job.report_id, {
        entity_type: EExecutionLogEntityType.WORK_ITEM,
        phase: "SEND_TO_CELERY",
        ignore_summarization: true,
        level: EExecutionLogLevel.SUCCESS,
        additional_data: {
          issuesSent: bulkPayload.length,
          totalComments,
          totalPropertyValues,
          issuesWithAttachments,
          totalAttachments,
        },
      });

      logger.info(`[${job.id}] [${this.name}] Sent to Celery`, {
        jobId: job.id,
        issues: bulkPayload.length,
        totalComments,
        totalPropertyValues,
      });

      return bulkPayload;
    } catch (error) {
      logger.error(`[${job.id}][${this.name}] Unable to send issues to Celery`, error);

      executionLog.collect(job.report_id, {
        entity_type: EExecutionLogEntityType.WORK_ITEM,
        phase: "SEND_TO_CELERY",
        ignore_summarization: true,
        level: EExecutionLogLevel.ERROR,
        error: extractErrorMetadata(error),
        additional_data: {
          attemptedIssues: bulkPayload.length,
        },
      });

      throw error;
    }
  }

  /**
   * Store relations data for Relations Step
   * Appends to existing data (accumulated across pages)
   */
  private async storeRelations(
    relations: TIssueRelationsData[],
    storage: IStorageService,
    jobId: string
  ): Promise<void> {
    // Append to existing relations
    await storage.storeData(jobId, E_ADDITIONAL_STORAGE_KEYS.JIRA_ISSUE_RELATIONS, relations, ["external_id"]);

    logger.info(`[${jobId}] [${this.name}] Stored relations`, {
      jobId,
      thisPage: relations.length,
    });
  }
}
