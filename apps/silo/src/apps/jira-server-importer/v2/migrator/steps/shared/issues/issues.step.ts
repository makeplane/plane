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

import type { Worklog } from "jira.js/out/version2/models/index.js";
import { v4 as uuidv4 } from "uuid";
import type { E_IMPORTER_KEYS, TIssuePropertyValuesPayload } from "@plane/etl/core";
import type { IJiraIssue, JiraConfig, JiraIssueField, JiraV2Service } from "@plane/etl/jira-server";
import {
  pullAllCommentsForIssue,
  pullAllWorklogsForIssue,
  pullIssuesV2,
  transformComment,
  transformIssueV2,
} from "@plane/etl/jira-server";
import { logger } from "@plane/logger";
import type { ExIssue, ExIssueComment, ExIssueProperty, ExIssuePropertyOption, TWorklog } from "@plane/sdk";
import type { TImportJob } from "@plane/types";
import { getTransformedIssuePropertyValuesV2 } from "@/apps/jira-server-importer/migrator/transformers";
import { createEmptyContext, createPaginationContext } from "@/apps/jira-server-importer/v2/helpers/ctx";
import { buildExternalId, extractJobData } from "@/apps/jira-server-importer/v2/helpers/job";
import { detectSprintFieldId, parseJiraServerSprint } from "@/apps/jira-server-importer/v2/helpers/sprints";
import type {
  IStep,
  IStorageService,
  TIssuePropertiesData,
  TIssueRelationsData,
  TIssuesAssociationsData,
  TIssueTypesData,
  TJobContext,
  TStepExecutionContext,
  TStepExecutionInput,
} from "@/apps/jira-server-importer/v2/types";
import { E_ADDITIONAL_STORAGE_KEYS, EJiraStep } from "@/apps/jira-server-importer/v2/types";
import { generateIssuePayloadV2 } from "@/etl/migrator/issues.migrator";
import { getAPIClientInternal } from "@/services/client";
import type { BulkIssuePayload } from "@/types";
import { celeryProducer } from "@/worker";

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

      // Get property data from dependencies (needed for property value transformation)
      const propertyData = this.getPropertyData(job.id, dependencyData);
      const additionalData = await this.getAdditionalData(storage, job);

      // Pull paginated issues from Jira (can be overridden in subclasses)
      const issuesResult = await this.pull({
        jobContext,
        projectKey,
        jql,
        paginationCtx,
      });

      await this.initializeReportBatchCount(paginationCtx, issuesResult.total, job);

      if (this.shouldReturnEmpty(issuesResult, paginationCtx)) {
        logger.info(`[${job.id}] [${this.name}] No issues found`, { jobId: job.id });
        return createEmptyContext();
      }

      // Process issues: extract comments and transform property values
      const processed = await this.processIssuesData({
        jobContext,
        issuesResult,
        propertyData,
        additionalData,
      });

      const associations = await this.extractAssociations(job, jobContext.sourceClient, processed.issues);

      // Load entity mappings from storage
      const mappings = await this.loadMappings(job, processed.issues, associations, storage);

      // Transform issues (uses existing transformIssue function)
      const transformed = await this.transform(job, processed.issues);

      // Generate payload and send to Celery
      const pushed = await this.push(
        transformed,
        processed.comments,
        processed.propertyValues,
        mappings,
        associations,
        propertyData,
        jobContext
      );

      // Store relations for Relations Step
      const relations = this.extractRelations(job, processed.issues);
      await this.storeRelations(relations, storage, job.id);

      logger.info(`[${job.id}] [${this.name}] Completed page`, {
        jobId: job.id,
        issues: processed.issues.length,
        comments: processed.comments.length,
        pushed: pushed.length,
      });

      return this.buildNextContext(issuesResult, paginationCtx, processed.issues.length, pushed.length);
    } catch (error) {
      logger.error(`[${job.id}] [${this.name}] Step failed`, {
        jobId: job.id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
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
  }

  /**
   * Extract and transform comments from issues
   * Merges timestamps from fields.comment with HTML body from renderedFields.comment
   */
  protected async extractCommentsFromIssues(props: {
    _jobContext: TJobContext;
    issues: IJiraIssue[];
    resourceId: string;
    projectId: string;
  }): Promise<ExIssueComment[]> {
    const comments = [];
    for (const issue of props.issues) {
      const fieldsComments = issue.fields?.comment?.comments || [];
      const renderedComments = issue.renderedFields?.comment?.comments || [];
      /*
       * Jira provides us with the comments, but those comments are paginated, in
       * case the number of comments are more than what we have in the comments property
       * we will need to fetch the remaining comments.
       */
      const shouldFetchMoreComments = issue.fields.comment?.total > issue.fields.comment?.comments?.length;
      if (shouldFetchMoreComments) {
        const allComments = await pullAllCommentsForIssue(issue, props._jobContext.sourceClient);
        const transformedComments = allComments.map((comment) =>
          transformComment({ resourceId: props.resourceId, projectId: props.projectId, source: this.source }, comment)
        );
        comments.push(transformedComments);
      } else {
        // Create a map of rendered comments by ID for quick lookup
        const renderedCommentsMap = new Map(renderedComments.map((rendered) => [rendered.id, rendered]));

        const transformedComments = fieldsComments.map((comment) => {
          // Get the rendered version for HTML body
          const renderedComment = renderedCommentsMap.get(comment.id);

          // Merge: use fields comment (has proper timestamps) but replace body with rendered HTML
          // @ts-expect-error - body exists at runtime but not in type
          const body = renderedComment ? renderedComment.body : comment.body;

          const mergedComment = {
            ...comment,
            body: body,
            issue_id: issue.id,
          };

          return transformComment(
            { resourceId: props.resourceId, projectId: props.projectId, source: this.source },
            mergedComment
          );
        });
        comments.push(transformedComments);
      }
    }

    return comments.flat() as ExIssueComment[];
  }

  /**
   * Process pulled issues: extract comments and transform property values
   * Uses existing transformIssuePropertyValues for proper conversion
   */
  protected async processIssuesData(props: {
    jobContext: TJobContext;
    issuesResult: {
      items: IJiraIssue[];
      hasMore: boolean;
      total: number;
    };
    propertyData: {
      issueTypes: TIssueTypesData;
      planeIssueProperties: ExIssueProperty[];
      planeIssuePropertiesOptions: ExIssuePropertyOption[];
    };
    additionalData: {
      rawFields: JiraIssueField[];
    };
  }): Promise<{
    issues: IJiraIssue[];
    comments: ExIssueComment[];
    propertyValues: TIssuePropertyValuesPayload;
  }> {
    const { projectId, resourceId } = extractJobData(props.jobContext.job);

    // Extract comments from issues
    const comments = await this.extractCommentsFromIssues({
      _jobContext: props.jobContext,
      issues: props.issuesResult.items,
      resourceId,
      projectId,
    });

    // Transform property values for each issue using existing function
    const propertyValues = getTransformedIssuePropertyValuesV2(
      props.jobContext.job,
      props.issuesResult.items,
      props.additionalData.rawFields,
      props.propertyData.planeIssueProperties,
      props.propertyData.issueTypes
    );

    logger.info(`[${props.jobContext.job.id}] [${this.name}] Processed issues data`, {
      jobId: props.jobContext.job.id,
      issues: props.issuesResult.items.length,
      comments: comments.length,
      issuesWithPropertyValues: Object.keys(propertyValues).length,
    });

    return {
      issues: props.issuesResult.items,
      comments,
      propertyValues,
    };
  }

  /**
   * Get property data from dependencyData (loaded by orchestrator)
   */
  private getPropertyData(
    jobId: string,
    dependencyData: Record<string, any> | undefined
  ): {
    issueTypes: TIssueTypesData;
    planeIssueProperties: ExIssueProperty[];
    planeIssuePropertiesOptions: ExIssuePropertyOption[];
  } {
    if (!dependencyData) {
      return {
        issueTypes: [],
        planeIssueProperties: [],
        planeIssuePropertiesOptions: [],
      };
    }

    const issueTypes = dependencyData[EJiraStep.ISSUE_TYPES] as TIssueTypesData;
    const propertiesData = dependencyData[EJiraStep.ISSUE_PROPERTIES] as TIssuePropertiesData;
    const optionsData = dependencyData[EJiraStep.ISSUE_PROPERTY_OPTIONS];

    logger.info(`[${jobId}] [getPropertyData] issueTypes`, issueTypes);
    logger.info(`[${jobId}] [getPropertyData] propertiesData`, propertiesData);
    logger.info(`[${jobId}] [getPropertyData] optionsData`, optionsData);

    return {
      issueTypes: issueTypes || [],
      planeIssueProperties: (propertiesData as ExIssueProperty[]) || [],
      planeIssuePropertiesOptions: (optionsData as ExIssuePropertyOption[]) || [],
    };
  }

  private async getAdditionalData(
    storage: IStorageService,
    job: TImportJob<JiraConfig>
  ): Promise<{
    rawFields: JiraIssueField[];
  }> {
    const rawFields = await storage.retrieveData<JiraIssueField[]>(job.id, E_ADDITIONAL_STORAGE_KEYS.JIRA_RAW_FIELDS);
    if (!rawFields || rawFields.length === 0) {
      return {
        rawFields: [],
      };
    }
    return { rawFields };
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
  private async transform(job: TImportJob<JiraConfig>, issues: IJiraIssue[]): Promise<Partial<ExIssue>[]> {
    const resourceId = job.config?.resource?.id || "";
    const resourceUrl = job.config?.resource?.url || "";
    const stateMapping = job.config?.state || {};
    const priorityMapping = job.config?.priority || {};

    const transformed = issues.map((issue) =>
      transformIssueV2(
        { resourceId, projectId: job.project_id, source: this.source },
        issue,
        resourceUrl,
        stateMapping,
        priorityMapping
      )
    );

    return transformed;
  }

  /**
   * Extract all relations as external IDs
   * Single unified structure for Relations Step
   */
  private extractRelations(job: TImportJob<JiraConfig>, issues: IJiraIssue[]): TIssueRelationsData[] {
    const { projectId, resourceId } = extractJobData(job);
    return issues
      .map((issue) => ({
        external_id: buildExternalId(projectId, resourceId, issue.id),
        relationships: {
          parent: issue.fields.parent?.id ? buildExternalId(projectId, resourceId, issue.fields.parent?.id) : undefined,
          blocking: this.extractIssueLinks(job, issue, "Blocks", "outward"),
          is_blocked_by: this.extractIssueLinks(job, issue, "Blocks", "inward"),
          relates_to: this.extractIssueLinks(job, issue, "Relates", "both"),
          duplicate_of: this.extractIssueLinks(job, issue, "Duplicate", "outward")[0],
        },
      }))
      .filter(
        (rel) =>
          rel.relationships.parent ||
          rel.relationships.blocking.length > 0 ||
          rel.relationships.is_blocked_by.length > 0 ||
          rel.relationships.relates_to.length > 0 ||
          rel.relationships.duplicate_of
      );
  }

  private async extractAssociations(
    job: TImportJob<JiraConfig>,
    client: JiraV2Service,
    issues: IJiraIssue[]
  ): Promise<TIssuesAssociationsData> {
    const { projectId, resourceId } = extractJobData(job);
    const cycles = new Map<string, string[]>();
    const modules = new Map<string, string[]>();
    const worklogs = new Map<string, Partial<TWorklog>[]>();
    for (const issue of issues) {
      const issueExternalId = buildExternalId(projectId, resourceId, issue.id);
      const sprintExternalIds = this.extractSprints(job, issue);
      const componentExternalIds = this.extractComponents(job, issue);
      const issueWorklogs = await this.extractWorklogs(job, client, issue);
      cycles.set(issueExternalId, sprintExternalIds);
      modules.set(issueExternalId, componentExternalIds);
      worklogs.set(issueExternalId, issueWorklogs);
    }
    return { cycles, modules, worklogs };
  }

  protected extractSprints(job: TImportJob<JiraConfig>, issue: IJiraIssue): string[] {
    const { projectId, resourceId } = extractJobData(job);

    const sprintFieldKey = detectSprintFieldId(issue);
    const sprintFieldValue = sprintFieldKey ? issue.fields[sprintFieldKey] : null;
    const sprintObjects = sprintFieldValue
      ? Array.isArray(sprintFieldValue)
        ? sprintFieldValue.map((s) => parseJiraServerSprint(s))
        : [parseJiraServerSprint(sprintFieldValue)]
      : null;
    return sprintObjects
      ? sprintObjects
          .map((s) => (s ? buildExternalId(projectId, resourceId, s.id.toString()) : null))
          .filter((s) => s !== null)
      : [];
  }

  private extractComponents(job: TImportJob<JiraConfig>, issue: IJiraIssue): string[] {
    const { projectId, resourceId } = extractJobData(job);

    // Handle both array and non-array cases
    const components = issue.fields.components;
    if (!components) return [];

    return components.map((c) => buildExternalId(projectId, resourceId, c.id!)).filter((c) => c !== undefined);
  }

  /**
   * Extract issue link keys of specific type and direction
   */
  private extractIssueLinks(
    job: TImportJob<JiraConfig>,
    issue: IJiraIssue,
    linkType: string,
    direction: "inward" | "outward" | "both"
  ): string[] {
    const links: string[] = [];
    const { projectId, resourceId } = extractJobData(job);

    // Handle both array and non-array cases
    const issuelinks = issue.fields.issuelinks;
    if (!issuelinks) return links;

    issuelinks.forEach((link) => {
      if (link.type?.name === linkType) {
        if (direction === "outward" || direction === "both") {
          if (link.outwardIssue?.id) links.push(buildExternalId(projectId, resourceId, link.outwardIssue.id));
        }
        if (direction === "inward" || direction === "both") {
          if (link.inwardIssue?.id) links.push(buildExternalId(projectId, resourceId, link.inwardIssue.id));
        }
      }
    });

    return links;
  }

  /**
   * Extract worklogs from issue
   */
  protected async extractWorklogs(
    _job: TImportJob<JiraConfig>,
    client: JiraV2Service,
    issue: IJiraIssue
  ): Promise<Partial<TWorklog>[]> {
    const transformWorklog = (worklog: Worklog) => ({
      description: worklog.comment ?? "",
      duration: worklog.timeSpentSeconds ? worklog.timeSpentSeconds / 60 : 0,
      logged_by: worklog.author?.emailAddress,
      created_at: worklog.created,
      updated_at: worklog.updated,
    });

    const shouldPullMoreWorklogs = issue.fields?.worklog?.total > issue.fields?.worklog?.worklogs?.length;
    if (shouldPullMoreWorklogs) {
      const worklogs = await pullAllWorklogsForIssue(issue, client);
      return worklogs.map(transformWorklog);
    }

    return (
      issue.fields?.worklog?.worklogs?.map((worklog, index) => {
        const comment =
          typeof worklog.comment === "string"
            ? worklog.comment
            : issue.renderedFields?.worklog?.worklogs?.[index]?.comment;

        return transformWorklog({ ...worklog, comment });
      }) || []
    );
  }

  /**
   * Generate BulkIssuePayload and send to Celery
   * Uses generateIssuePayloadV2 to process attachments and resolve all entities
   */
  private async push(
    issues: Partial<ExIssue>[],
    comments: ExIssueComment[],
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

    // Generate complete BulkIssuePayload
    const bulkPayload: BulkIssuePayload[] = await generateIssuePayloadV2({
      jobId: job.id,
      issues: issues as ExIssue[],
      issueComments: comments,
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

    await celeryProducer.registerTask(
      payload,
      job.workspace_slug,
      job.project_id,
      job.id,
      credentials.user_id,
      uuidv4(),
      "plane.bgtasks.data_import_task.import_data"
    );

    logger.info(`[${job.id}] [${this.name}] Sent to Celery`, {
      jobId: job.id,
      issues: bulkPayload.length,
      totalComments: bulkPayload.reduce((sum, i) => sum + i.comments.length, 0),
      totalPropertyValues: bulkPayload.reduce((sum, i) => sum + i.issue_property_values.length, 0),
    });

    return bulkPayload;
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
    await storage.storeData(jobId, E_ADDITIONAL_STORAGE_KEYS.JIRA_ISSUE_RELATIONS, relations, "external_id");

    logger.info(`[${jobId}] [${this.name}] Stored relations`, {
      jobId,
      thisPage: relations.length,
    });
  }
}
