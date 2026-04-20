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
import { E_IMPORTER_KEYS } from "@plane/etl/core";
import type { TIssuePropertyValuesPayload } from "@plane/etl/core";
import type { IJiraIssue, JiraConfig, JiraIssueField } from "@plane/etl/jira-server";
import { buildExtenalId, pullIssuesV2, transformIssueV2 } from "@plane/etl/jira-server";
import { logger } from "@plane/logger";
import type { ExIssue, ExIssueActivity, ExIssueComment, ExIssueProperty, ExIssuePropertyOption } from "@plane/sdk";
import type { TImportJob } from "@plane/types";
import { createEmptyContext, createPaginationContext } from "@/apps/jira-server-importer/v2/helpers/ctx";
import type {
  IStep,
  IStorageService,
  TCustomRelationData,
  TCrossProjectRelation,
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
import { buildExternalId, extractJobData } from "@/apps/jira-server-importer/v2/helpers/job";
import { generateIssuePayloadV2 } from "@/etl/migrator/issues.migrator";
import { getAPIClientInternal } from "@/services/client";
import type { BulkIssuePayload } from "@/types";
import { celeryProducer } from "@/worker";
import { extractErrorMetadata } from "@/helpers/errors";
import { executionLog } from "@/lib/execution-log/service/execution-log.service";
import { EExecutionLogLevel, EExecutionLogEntityType } from "@/lib/execution-log/types";
import { integrationConnectionHelper } from "@/helpers/integration-connection-helper";
import { DB } from "@/db/client";
import { JiraIssueDataExtractor } from "./extractors/data.extractor";
import { getKnownFieldIds } from "@/apps/jira-server-importer/v2/helpers/known-fields";
import { syncAssociatedUsers } from "./users/on-demand-users.sync";

/**
 * Jira Server Issues Step
 *
 * Pulls issues paginated with comments and property values
 * Processes attachments inline, resolves all entities
 * Uses existing transform functions for proper data conversion
 * Strips parent/cycles/modules → stored as relations for later
 *
 * Cross-project relations:
 * - When a cross-project link is detected and the other project IS imported:
 *   → resolves to a normal relation using the other project's Plane ID
 * - When the other project is NOT imported:
 *   → stores a WorkspaceEntityConnection (WEC) record keyed by the other issue's key
 * - When importing an issue, checks for existing WEC records keyed by the current issue's key
 *   → these are deferred relations from previously imported projects
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
    EJiraStep.RELEASES, // Provides releases
  ];

  constructor(private readonly source: E_IMPORTER_KEYS.JIRA_SERVER | E_IMPORTER_KEYS.JIRA) {}

  private readonly PAGE_SIZE = 50;

  async execute(input: TStepExecutionInput): Promise<TStepExecutionContext> {
    const { jobContext, storage, previousContext, dependencyData } = input;
    const { job } = jobContext;

    try {
      const config = job.config as JiraConfig;
      const epicsAsWorkItems = config.importEpicsAsWorkItems;
      const importWorkItemTypesGlobally = config.importWorkItemTypesGlobally ?? false;
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
        epicsAsWorkItems: epicsAsWorkItems || false,
        storage,
      });

      const {
        processedIssues,
        comments,
        propertyValues,
        associations,
        relations,
        issueActivities,
        crossProjectRelations,
      } = {
        processedIssues: extractedData.issues,
        comments: extractedData.comments,
        propertyValues: extractedData.propertyValues,
        associations: extractedData.associations,
        relations: extractedData.relations,
        issueActivities: extractedData.issueActivities,
        crossProjectRelations: extractedData.crossProjectRelations,
      };

      // Handle cross-project relations:
      // 1. Resolve deferred relations (WEC records from previously imported projects)
      // 2. Store new cross-project relations as WEC records (or resolve immediately)
      const crossProjectResolvedRelations = await this.handleCrossProjectRelations(
        crossProjectRelations,
        processedIssues,
        jobContext,
        storage
      );

      // Merge resolved cross-project relations into the main relations array.
      // Must merge by external_id to avoid deduplication overwrites in storage.
      const allRelations = this.mergeRelationsByExternalId([...relations, ...crossProjectResolvedRelations]);

      // Plugin: sync on-demand users (creates missing Plane users + appends USERS mappings)
      if (this.source === E_IMPORTER_KEYS.JIRA_SERVER) {
        await syncAssociatedUsers({
          jobContext,
          storage,
          extractedUsers: extractedData.extractedUsers,
        });
      }

      // Load entity mappings from storage
      const mappings = await this.loadMappings(
        job,
        processedIssues,
        associations,
        storage,
        importWorkItemTypesGlobally
      );

      // Transform issues (uses existing transformIssue function)
      const transformed = await this.transform(job, processedIssues, additionalData.knownCustomFieldMapping);

      // Generate payload and send to Celery
      const pushed = await this.push(
        transformed,
        comments,
        issueActivities,
        propertyValues,
        mappings,
        associations,
        propertyData,
        jobContext
      );

      // Store relations for Relations Step
      await this.storeRelations(allRelations, storage, job.id);

      logger.info(`[${job.id}] [${this.name}] Completed page`, {
        jobId: job.id,
        issues: processedIssues.length,
        comments: comments.length,
        pushed: pushed.length,
        crossProjectRelations: crossProjectRelations.length,
        crossProjectResolved: crossProjectResolvedRelations.length,
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
    storage: IStorageService,
    importWorkItemTypesGlobally: boolean
  ): Promise<{
    userMap: Map<string, string>;
    releaseMap: Map<string, string>;
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
        const issueTypeExternalId = importWorkItemTypesGlobally
          ? buildExtenalId([resourceId, issue.fields.issuetype.id])
          : buildExtenalId([projectId, resourceId, issue.fields.issuetype.id]);
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
    const [userMap, releaseMap, issueTypeMap, cycleMap, moduleMap] = await Promise.all([
      // We are retrieving all users instead of associated users, as there can be custom fields that associates with users, and we can't select those
      storage.retrieveMapping(jobId, EJiraStep.USERS),
      storage.retrieveMapping(jobId, EJiraStep.RELEASES),
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
      cycles: cycleMap.size,
      modules: moduleMap.size,
    });

    return { userMap, releaseMap, issueTypeMap, cycleMap, moduleMap };
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
    const config = job.config;
    const importWorkItemTypesGlobally = config.importWorkItemTypesGlobally ?? false;

    const resourceId = job.config?.resource?.id || "";
    const resourceUrl = job.config?.resource?.url || "";
    const stateMapping = job.config?.state || [];
    const priorityMapping = job.config?.priority || [];
    const startDateFields = getKnownFieldIds(knownCustomFieldMapping, "START_DATE");
    const storyPointsFields = getKnownFieldIds(knownCustomFieldMapping, "STORY_POINTS");
    const completionDateFields = getKnownFieldIds(knownCustomFieldMapping, "COMPLETION_DATE");

    const transformed = issues.map((issue) =>
      transformIssueV2(
        { resourceId, projectId: job.project_id, source: this.source },
        issue,
        resourceUrl,
        stateMapping,
        priorityMapping,
        {
          startDateFields,
          completionDateFields,
          storyPointsFields,
        },
        importWorkItemTypesGlobally
      )
    );

    return transformed;
  }

  /**
   * Generate BulkIssuePayload and send to Celery
   * Uses generateIssuePayloadV2 to process attachments and resolve all entities
   */
  private async push(
    issues: Partial<ExIssue>[],
    comments: Partial<ExIssueComment>[],
    issueActivities: Partial<ExIssueActivity>[],
    propertyValues: TIssuePropertyValuesPayload,
    mappings: {
      userMap: Map<string, string>;
      issueTypeMap: Map<string, string>;
      cycleMap: Map<string, string>;
      moduleMap: Map<string, string>;
      releaseMap: Map<string, string>;
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
      issueActivities: issueActivities as ExIssueActivity[],
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
      releaseMap: mappings.releaseMap,
    });

    const payload = {
      issues: bulkPayload,
      isLastBatch: false,
      preserveSequence: true,
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
      const totalIssueActivities = bulkPayload.reduce((sum, i) => sum + (i.activities?.length || 0), 0);
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
          totalIssueActivities,
          issuesWithAttachments,
          totalAttachments,
        },
      });

      logger.info(`[${job.id}] [${this.name}] Sent to Celery`, {
        jobId: job.id,
        issues: bulkPayload.length,
        totalComments,
        totalPropertyValues,
        totalIssueActivities,
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

  /**
   * Merge multiple TIssueRelationsData entries that share the same external_id.
   *
   * Storage deduplicates by external_id (last write wins), so if we have two entries
   * for the same issue (e.g., one from same-project extraction, one from cross-project
   * resolution), the second would overwrite the first. This method combines their
   * relationships into a single entry per external_id.
   */
  private mergeRelationsByExternalId(relations: TIssueRelationsData[]): TIssueRelationsData[] {
    const merged = new Map<string, TIssueRelationsData>();

    for (const rel of relations) {
      const existing = merged.get(rel.external_id);
      if (!existing) {
        merged.set(rel.external_id, {
          external_id: rel.external_id,
          relationships: {
            parent: rel.relationships.parent,
            blocking: [...rel.relationships.blocking],
            is_blocked_by: [...rel.relationships.is_blocked_by],
            relates_to: [...rel.relationships.relates_to],
            duplicate_of: rel.relationships.duplicate_of,
            custom_relations: [...(rel.relationships.custom_relations ?? [])],
          },
        });
      } else {
        // Merge: parent uses first non-empty value, arrays are concatenated, duplicate_of uses first non-empty
        if (!existing.relationships.parent && rel.relationships.parent) {
          existing.relationships.parent = rel.relationships.parent;
        }
        existing.relationships.blocking.push(...rel.relationships.blocking);
        existing.relationships.is_blocked_by.push(...rel.relationships.is_blocked_by);
        existing.relationships.relates_to.push(...rel.relationships.relates_to);
        if (!existing.relationships.duplicate_of && rel.relationships.duplicate_of) {
          existing.relationships.duplicate_of = rel.relationships.duplicate_of;
        }
        existing.relationships.custom_relations.push(...(rel.relationships.custom_relations ?? []));
      }
    }

    return Array.from(merged.values());
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Cross-project relations
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Handle all cross-project relation logic:
   * 1. Resolve deferred relations (WEC records from previously imported projects)
   * 2. For new cross-project links, check if the other project is already imported
   *    - If yes: resolve immediately (build external_id using other project's Plane ID)
   *    - If no: store a WEC record for later resolution
   *
   * Returns resolved relations to merge into the main relations array.
   */
  private async handleCrossProjectRelations(
    crossProjectRelations: TCrossProjectRelation[],
    processedIssues: IJiraIssue[],
    jobContext: TJobContext,
    storage: IStorageService
  ): Promise<TIssueRelationsData[]> {
    const { job } = jobContext;
    const { projectId, resourceId } = extractJobData(job);
    const resolvedRelations: TIssueRelationsData[] = [];

    try {
      // 1. Resolve deferred relations: check if any WEC records exist for issues in this batch
      const deferredRelations = await this.resolveDeferredRelations(processedIssues, jobContext, storage);
      resolvedRelations.push(...deferredRelations);

      // 2. Process new cross-project relations from this batch
      if (crossProjectRelations.length > 0) {
        const { resolved, deferred } = await this.classifyCrossProjectRelations(
          crossProjectRelations,
          projectId,
          resourceId,
          job.workspace_id
        );

        // Add immediately resolved relations
        resolvedRelations.push(...resolved);

        // Store deferred relations as WEC records
        if (deferred.length > 0) {
          await this.storeDeferredRelations(deferred, processedIssues, jobContext, storage);
        }
      }

      logger.info(`[${job.id}] [${this.name}] Cross-project relations handled`, {
        jobId: job.id,
        deferredResolved: deferredRelations.length,
        immediatelyResolved: resolvedRelations.length - deferredRelations.length,
        storedForLater: crossProjectRelations.length - (resolvedRelations.length - deferredRelations.length),
      });
    } catch (error) {
      // Non-fatal: log and continue
      logger.error(`[${job.id}] [${this.name}] Error handling cross-project relations`, {
        jobId: job.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return resolvedRelations;
  }

  /**
   * Look up deferred cross-project relations for issues in the current batch.
   *
   * When a previous project import stored WEC records with entity_id = ${resourceId}:${issueKey},
   * those records are resolved here when this issue is being imported.
   */
  private async resolveDeferredRelations(
    processedIssues: IJiraIssue[],
    jobContext: TJobContext,
    storage: IStorageService
  ): Promise<TIssueRelationsData[]> {
    const { job } = jobContext;
    const { projectId, resourceId } = extractJobData(job);
    const resolvedRelations: TIssueRelationsData[] = [];

    const workspaceConnectionId = await this.getOrCreateWorkspaceConnectionId(jobContext, storage);

    for (const issue of processedIssues) {
      const entityId = `${resourceId}:${issue.key}`;

      try {
        // TODO: Let's add type and entity_type as well to accurately get results
        const wecRecords = await integrationConnectionHelper.findWorkspaceEntityConnections({
          workspace_connection_id: workspaceConnectionId,
          entity_id: entityId,
        });

        if (!wecRecords || wecRecords.length === 0) continue;

        const currentIssueExternalId = buildExternalId(projectId, resourceId, issue.id);

        for (const wec of wecRecords) {
          const entityData = wec.entity_data as Record<string, any>;
          const relationType = (entityData.relation_type as string) ?? "";
          const sourceExternalId = entityData.source_external_id as string | null;

          // The WEC was created by the OTHER project's import.
          // "source" in the WEC = the issue from that other import
          // "target" in the WEC = the issue in THIS project (which we're now importing)
          // The current issue matches the entity_id, so we are the "target" side.

          const otherExternalId = sourceExternalId; // the other issue's external_id
          if (!otherExternalId) {
            logger.warn(`[${job.id}] WEC ${wec.id} has no source_external_id, skipping`, { entityId });
            continue;
          }

          const relation = this.buildRelationFromDeferred(
            currentIssueExternalId,
            otherExternalId,
            relationType,
            wec.entity_type ?? "",
            entityData
          );

          if (relation) {
            resolvedRelations.push(relation);
          }
        }

        logger.debug(`[${job.id}] Resolved ${wecRecords.length} deferred relations for ${issue.key}`, {
          entityId,
        });
      } catch (error) {
        logger.warn(`[${job.id}] Failed to resolve deferred relations for ${issue.key}`, {
          entityId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return resolvedRelations;
  }

  /**
   * Build a TIssueRelationsData entry from a deferred WEC record.
   *
   * The current issue is the "target" side of the WEC (matched by entity_id).
   * We need to invert the relation since the WEC stores the relation
   * from the source's (other issue's) perspective.
   */
  private buildRelationFromDeferred(
    currentExternalId: string,
    otherExternalId: string,
    relationType: string,
    entityType: string,
    entityData?: Record<string, any>
  ): TIssueRelationsData | null {
    if (entityType === "RELATION:PARENT") {
      // The WEC says: "other issue is the parent of source issue"
      // But WE are the parent (entity_id matches our key).
      // The source (other) issue's child needs us as parent.
      // relation_type = "parent" means target_jira_key's parent is source_jira_key
      // Wait — entity_id = ${resourceId}:${parentKey}, and we ARE the parent.
      // The WEC's target_external_id = child's external_id (from the import that created the WEC)
      // The WEC's source_external_id = null (we weren't imported yet) OR it's set
      // Actually, re-reading the convention:
      // source = the issue from the import that created the WEC (the child)
      // target = the issue in the not-yet-imported project (us, the parent)
      // So: source = child, target = parent (us)
      // We set the child's parent to us:
      return {
        external_id: otherExternalId, // child's external_id
        relationships: {
          parent: currentExternalId, // parent = us
          blocking: [],
          is_blocked_by: [],
          relates_to: [],
          duplicate_of: "",
          custom_relations: [],
        },
      };
    }

    // RELATION:OTHER — invert the relation type since we're now on the target side
    switch (relationType) {
      case "relates_to":
        return {
          external_id: currentExternalId,
          relationships: {
            blocking: [],
            is_blocked_by: [],
            relates_to: [otherExternalId],
            duplicate_of: "",
            custom_relations: [],
          },
        };

      case "blocks":
        // Source (other) said they "block" us → we are blocked_by them
        return {
          external_id: currentExternalId,
          relationships: {
            blocking: [],
            is_blocked_by: [otherExternalId],
            relates_to: [],
            duplicate_of: "",
            custom_relations: [],
          },
        };

      case "blocked_by":
        // Source (other) said they are "blocked_by" us → we block them
        return {
          external_id: currentExternalId,
          relationships: {
            blocking: [otherExternalId],
            is_blocked_by: [],
            relates_to: [],
            duplicate_of: "",
            custom_relations: [],
          },
        };

      case "duplicate":
        return {
          external_id: currentExternalId,
          relationships: {
            blocking: [],
            is_blocked_by: [],
            relates_to: [],
            duplicate_of: otherExternalId,
            custom_relations: [],
          },
        };

      case "custom": {
        // Reconstruct custom relation from WEC entity_data
        const linkType = entityData?.link_type;
        if (!linkType) {
          return {
            external_id: currentExternalId,
            relationships: {
              blocking: [],
              is_blocked_by: [],
              relates_to: [otherExternalId],
              duplicate_of: "",
              custom_relations: [],
            },
          };
        }

        // The WEC was stored from the source's perspective.
        // Source stored current_is_outward for its own issue.
        // We (target) are the OTHER side, so we invert:
        // If source was outward (current_is_outward=false means source is issue_id),
        // then for us the source is the linked issue, and we are issue_id → current_is_outward stays false.
        // Actually, the roles reverse: source's linked issue is us (target).
        // We need to set current_is_outward for OUR issue relative to the link.
        // Source had: current_is_outward = X, linked = target (us)
        // Now we have: current = us (target), linked = source (other)
        // We invert: current_is_outward = !X
        const sourceCurrentIsOutward = entityData?.current_is_outward ?? false;

        return {
          external_id: currentExternalId,
          relationships: {
            blocking: [],
            is_blocked_by: [],
            relates_to: [],
            duplicate_of: "",
            custom_relations: [
              {
                link_external_id: entityData?.link_id
                  ? buildExternalId(
                      currentExternalId.split("_")[0],
                      currentExternalId.split("_")[1],
                      entityData.link_id
                    )
                  : "",
                linked_issue_external_id: otherExternalId,
                link_type: linkType,
                current_is_outward: !sourceCurrentIsOutward,
              },
            ],
          },
        };
      }

      default:
        // Unknown relation type, treat as relates_to
        return {
          external_id: currentExternalId,
          relationships: {
            blocking: [],
            is_blocked_by: [],
            relates_to: [otherExternalId],
            duplicate_of: "",
            custom_relations: [],
          },
        };
    }
  }

  /**
   * Classify cross-project relations into immediately resolvable and deferred.
   *
   * A relation is immediately resolvable if the other project has already been
   * imported to Plane (checked via external_source='JIRA' and external_id on project table).
   */
  private async classifyCrossProjectRelations(
    relations: TCrossProjectRelation[],
    currentProjectId: string,
    resourceId: string,
    workspaceId: string
  ): Promise<{
    resolved: TIssueRelationsData[];
    deferred: TCrossProjectRelation[];
  }> {
    const resolved: TIssueRelationsData[] = [];
    const deferred: TCrossProjectRelation[] = [];

    // Cache project lookups to avoid repeated DB queries
    const projectCache = new Map<string, string | null>(); // otherProjectKey → Plane project ID or null

    for (const rel of relations) {
      let otherPlaneProjectId = projectCache.get(rel.otherProjectKey);

      if (otherPlaneProjectId === undefined) {
        // Look up the other project in the DB
        otherPlaneProjectId = await this.lookupPlaneProject(resourceId, rel.otherProjectKey, workspaceId);
        projectCache.set(rel.otherProjectKey, otherPlaneProjectId);
      }

      if (otherPlaneProjectId) {
        // Other project exists — resolve immediately
        const currentExternalId = buildExternalId(currentProjectId, resourceId, rel.currentIssueId);
        const otherExternalId = buildExternalId(otherPlaneProjectId, resourceId, rel.otherIssueId);

        const relation = this.buildResolvedRelation(
          currentExternalId,
          otherExternalId,
          rel,
          currentProjectId,
          resourceId
        );
        if (relation) {
          resolved.push(relation);
        }
      } else {
        // Other project not imported yet — defer
        deferred.push(rel);
      }
    }

    return { resolved, deferred };
  }

  /**
   * Look up a Plane project by its Jira external_id.
   * Returns the Plane project UUID if found, null otherwise.
   */
  private async lookupPlaneProject(
    resourceId: string,
    jiraProjectKey: string,
    workspaceId: string
  ): Promise<string | null> {
    try {
      const db = DB.getInstance();
      const externalId = `${resourceId}_${jiraProjectKey}`;
      const rows = await db.query<{ id: string }>(
        `SELECT id FROM projects WHERE external_source = $1 AND external_id = $2 AND workspace_id = $3 AND deleted_at IS NULL ORDER BY UPDATED_AT DESC LIMIT 1`,
        [this.source, externalId, workspaceId]
      );
      return rows.length > 0 ? rows[0].id : null;
    } catch (error) {
      logger.warn(`Failed to look up Plane project for ${jiraProjectKey}`, {
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Build a TIssueRelationsData for an immediately resolved cross-project relation.
   * The relation is FROM the current issue TO the other issue.
   */
  private buildResolvedRelation(
    currentExternalId: string,
    otherExternalId: string,
    rel: TCrossProjectRelation,
    projectId: string,
    resourceId: string
  ): TIssueRelationsData | null {
    const emptyRelationships = {
      blocking: [] as string[],
      is_blocked_by: [] as string[],
      relates_to: [] as string[],
      duplicate_of: "",
      custom_relations: [] as TCustomRelationData[],
    };

    switch (rel.relationType) {
      case "parent":
        return {
          external_id: currentExternalId,
          relationships: { ...emptyRelationships, parent: otherExternalId },
        };

      case "blocks":
        return {
          external_id: currentExternalId,
          relationships: { ...emptyRelationships, blocking: [otherExternalId] },
        };

      case "blocked_by":
        return {
          external_id: currentExternalId,
          relationships: { ...emptyRelationships, is_blocked_by: [otherExternalId] },
        };

      case "relates_to":
        return {
          external_id: currentExternalId,
          relationships: { ...emptyRelationships, relates_to: [otherExternalId] },
        };

      case "duplicate":
        return {
          external_id: currentExternalId,
          relationships: { ...emptyRelationships, duplicate_of: otherExternalId },
        };

      case "custom":
        if (!rel.linkType) {
          return {
            external_id: currentExternalId,
            relationships: { ...emptyRelationships, relates_to: [otherExternalId] },
          };
        }
        return {
          external_id: currentExternalId,
          relationships: {
            ...emptyRelationships,
            custom_relations: [
              {
                link_external_id: rel.linkId ? buildExternalId(projectId, resourceId, rel.linkId) : "",
                linked_issue_external_id: otherExternalId,
                link_type: rel.linkType,
                current_is_outward: rel.currentIsOutward ?? false,
              },
            ],
          },
        };

      default:
        return {
          external_id: currentExternalId,
          relationships: { ...emptyRelationships, relates_to: [otherExternalId] },
        };
    }
  }

  /**
   * Store deferred cross-project relations as WorkspaceEntityConnection records.
   *
   * For each relation:
   * - entity_id = ${resourceId}:${otherIssueKey} (keyed by the OTHER project's issue)
   * - entity_type = 'RELATION:PARENT' or 'RELATION:OTHER'
   * - entity_data stores enough info to resolve the relation when the other project is imported
   *
   * Convention for entity_data:
   * - source = the issue from the current import (known external_id)
   * - target = the issue in the other project (unknown external_id)
   */
  private async storeDeferredRelations(
    deferredRelations: TCrossProjectRelation[],
    _processedIssues: IJiraIssue[],
    jobContext: TJobContext,
    storage: IStorageService
  ): Promise<void> {
    const { job } = jobContext;
    const { projectId, resourceId } = extractJobData(job);

    const workspaceConnectionId = await this.getOrCreateWorkspaceConnectionId(jobContext, storage);

    const promises = deferredRelations.map(async (rel) => {
      const entityId = `${resourceId}:${rel.otherIssueKey}`;
      const entityType = rel.relationType === "parent" ? "RELATION:PARENT" : "RELATION:OTHER";
      const currentExternalId = buildExternalId(projectId, resourceId, rel.currentIssueId);

      try {
        const entityData: Record<string, any> = {
          resource_id: resourceId,
          relation_type: rel.relationType,
          source_jira_id: rel.currentIssueId,
          target_jira_id: rel.otherIssueId,
          source_jira_key: rel.currentIssueKey,
          target_jira_key: rel.otherIssueKey,
          source_external_id: currentExternalId,
          target_external_id: null,
        };

        // Store custom relation metadata for later reconstruction
        if (rel.relationType === "custom" && rel.linkType) {
          entityData.link_type = rel.linkType;
          entityData.current_is_outward = rel.currentIsOutward ?? false;
          entityData.link_id = rel.linkId ?? null;
        }

        await integrationConnectionHelper.createOrUpdateWorkspaceEntityConnection({
          workspace_id: job.workspace_id,
          workspace_connection_id: workspaceConnectionId,
          entity_type: entityType,
          type: "JIRA",
          entity_id: entityId,
          entity_data: entityData,
        });
      } catch (error) {
        logger.warn(`[${job.id}] Failed to store deferred relation WEC`, {
          entityId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });

    await Promise.all(promises);

    logger.info(`[${job.id}] [${this.name}] Stored ${deferredRelations.length} deferred cross-project relations`, {
      jobId: job.id,
      count: deferredRelations.length,
    });
  }

  /**
   * Ensure a WorkspaceConnection exists for this Jira import resource.
   * Creates one if it doesn't exist yet, and caches the ID in storage.
   */
  private async getOrCreateWorkspaceConnectionId(jobContext: TJobContext, storage: IStorageService): Promise<string> {
    const { job, credentials } = jobContext;

    // Check storage cache first
    const cached = await storage.retrieveData<string>(job.id, E_ADDITIONAL_STORAGE_KEYS.JIRA_WORKSPACE_CONNECTION_ID);
    if (cached) return cached;

    const { resourceId } = extractJobData(job);
    const resource = (job as TImportJob<JiraConfig>).config?.resource;
    const resourceUrl = resource?.url || "";
    const resourceName = resource?.name || "";

    const workspaceConnection = await integrationConnectionHelper.createOrUpdateWorkspaceConnection({
      workspace_id: job.workspace_id,
      connection_type: "JIRA_IMPORT",
      connection_id: resourceId,
      connection_slug: `jira-import-${resourceId}`,
      connection_data: {
        resource_url: resourceUrl,
        resource_name: resourceName,
      },
      credential_id: credentials.id,
    });

    const connectionId = workspaceConnection.id;

    // Cache in storage for subsequent pages
    await storage.storeData(job.id, E_ADDITIONAL_STORAGE_KEYS.JIRA_WORKSPACE_CONNECTION_ID, [connectionId], []);

    logger.info(`[${job.id}] [${this.name}] Created/retrieved WorkspaceConnection`, {
      jobId: job.id,
      workspaceConnectionId: connectionId,
    });

    return connectionId;
  }
}
