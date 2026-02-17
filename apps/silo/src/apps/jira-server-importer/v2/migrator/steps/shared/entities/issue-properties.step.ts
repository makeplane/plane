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

import { v4 as uuid } from "uuid";
import type { E_IMPORTER_KEYS } from "@plane/etl/core";
import type { JiraConfig, JiraIssueField } from "@plane/etl/jira-server";
import { pullIssueFieldsV2, transformIssueFields } from "@plane/etl/jira-server";
import { logger } from "@plane/logger";
import type { ExIssueProperty, ExIssueType } from "@plane/sdk";
import type { TImportJob } from "@plane/types";
import { withCache } from "@/apps/jira-server-importer/v2/helpers/cache";
import { createEmptyContext, createSuccessContext } from "@/apps/jira-server-importer/v2/helpers/ctx";
import type {
  IStep,
  IStorageService,
  TIssuePropertiesData,
  TIssueTypesData,
  TJobContext,
  TStepExecutionContext,
  TStepExecutionInput,
} from "@/apps/jira-server-importer/v2/types";
import { E_ADDITIONAL_STORAGE_KEYS, EJiraStep } from "@/apps/jira-server-importer/v2/types";
import { createOrUpdateIssueProperties } from "@/etl/migrator/issue-types/issue-property.migrator";
import { extractErrorMetadata } from "@/helpers/errors";
import { executionLog } from "@/lib/execution-log/service/execution-log.service";
import { EExecutionLogLevel, EExecutionLogEntityType } from "@/lib/execution-log/types";

/**
 * Jira Server Issue Properties Step
 * Pulls custom fields from Jira Server, transforms to Plane properties, and pushes
 *
 * Note: No pagination needed - fields are a small dataset
 */
export class JiraIssuePropertiesStep implements IStep {
  name = EJiraStep.ISSUE_PROPERTIES;
  dependencies = [EJiraStep.ISSUE_TYPES];

  constructor(protected readonly source: E_IMPORTER_KEYS.JIRA_SERVER | E_IMPORTER_KEYS.JIRA) {}

  async execute(input: TStepExecutionInput): Promise<TStepExecutionContext> {
    const { jobContext, storage, dependencyData } = input;
    const { job } = jobContext;

    try {
      const projectId = job.config?.project?.id;
      if (!projectId) {
        throw new Error("Project ID not found in job config");
      }

      // Load issue types from dependency
      const issueTypesData = dependencyData?.issue_types as TIssueTypesData;
      if (!issueTypesData || issueTypesData.length === 0) {
        logger.info(`[${jobContext.job.id}] [${this.name}] No issue types found, skipping properties`, {
          jobId: job.id,
        });
        return createEmptyContext();
      }

      logger.info(`[${jobContext.job.id}] [${this.name}] Starting execution`, {
        jobId: job.id,
        issueTypeCount: issueTypesData.length,
      });

      // Pull all fields (no pagination)
      const pulled = await this.pull(jobContext, projectId, issueTypesData);

      if (pulled.length === 0) {
        logger.info(`[${jobContext.job.id}] [${this.name}] No custom fields found`, { jobId: job.id });
        return createEmptyContext();
      }

      const transformed = this.transform(job, pulled);
      const pushed = await this.push(jobContext, transformed, issueTypesData);

      await Promise.all([
        this.storePropertiesData(this.name, jobContext.job, pushed, storage),
        this.storeAdditionalData(jobContext.job, storage, { rawFields: pulled }),
      ]);

      logger.info(`[${jobContext.job.id}] [${this.name}] Completed`, {
        jobId: job.id,
        pulled: pulled.length,
        pushed: pushed.length,
      });

      return createSuccessContext({
        pulled: pulled.length,
        pushed: pushed.length,
        totalProcessed: pulled.length,
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
   * Pull custom fields from Jira Server
   */
  protected async pull(
    jobCtx: TJobContext,
    projectId: string,
    issueTypesData: TIssueTypesData
  ): Promise<JiraIssueField[]> {
    try {
      // Convert stored issue types to format expected by pull function
      const issueTypes = issueTypesData.map((type) => ({
        id: type.external_id.split("_").pop()!,
        name: type.name,
      })) as { id: string; name: string }[];

      const result = await pullIssueFieldsV2(jobCtx.sourceClient, projectId, issueTypes);

      executionLog.collect(jobCtx.job.id, {
        entity_type: EExecutionLogEntityType.ISSUE_PROPERTY,
        phase: "PULL_CUSTOM_FIELDS",
        level: EExecutionLogLevel.INFO,
        metrics: {
          pulled: result.length,
        },
        additional_data: {
          issueTypesCount: issueTypes.length,
        },
      });

      logger.info(`[${jobCtx.job.id}] [${this.name}] Pulled custom fields`, {
        jobId: jobCtx.job.id,
        count: result.length,
      });

      return result;
    } catch (error) {
      logger.error(`[${jobCtx.job.id}][${this.name}] Unable to pull custom fields from Jira`, error);

      executionLog.collect(jobCtx.job.id, {
        entity_type: EExecutionLogEntityType.ISSUE_PROPERTY,
        phase: "PULL_CUSTOM_FIELDS",
        level: EExecutionLogLevel.ERROR,
        error: extractErrorMetadata(error),
        is_fatal: true,
      });

      throw error;
    }
  }

  /**
   * Transform Jira fields to Plane properties
   */
  private transform(job: TImportJob<JiraConfig>, jiraFields: JiraIssueField[]): Partial<ExIssueProperty>[] {
    const resourceId = job.config.resource ? job.config.resource.id : uuid();

    return jiraFields
      .map((field) => transformIssueFields({ resourceId, projectId: job.project_id, source: this.source }, field))
      .filter((field) => field && field.property_type) as Partial<ExIssueProperty>[];
  }

  /**
   * Push properties to Plane and store mappings
   */
  protected async push(
    jobContext: TJobContext,
    properties: Partial<ExIssueProperty>[],
    issueTypesData: TIssueTypesData
  ): Promise<ExIssueProperty[]> {
    // Build dependencies for push
    const issueTypesMap = this.buildIssueTypesMap(issueTypesData);
    const defaultIssueType = this.getDefaultIssueType(issueTypesData);
    const existingProperties = await this.fetchExistingProperties(jobContext, issueTypesData);

    // Separate create vs update
    const { toCreate, toUpdate } = this.separateCreateAndUpdate(properties, existingProperties);

    // Create and update
    const created = await this.putProperties(jobContext, toCreate, issueTypesMap, defaultIssueType, "create");
    const updated = await this.putProperties(jobContext, toUpdate, issueTypesMap, defaultIssueType, "update");

    const allProperties = [...created, ...updated];

    return allProperties;
  }

  /**
   * Create or update properties in Plane
   */
  private async putProperties(
    jobContext: TJobContext,
    properties: Partial<ExIssueProperty>[],
    issueTypesMap: Map<string, ExIssueType>,
    defaultIssueType: ExIssueType | undefined,
    method: "create" | "update"
  ): Promise<ExIssueProperty[]> {
    if (properties.length === 0) return [];

    const { job, planeClient } = jobContext;

    logger.info(`[${job.id}] [${this.name}] Putting Properties: ${method} mode`, {
      jobId: job.id,
      count: properties.length,
    });

    try {
      // Summary is collected inside createOrUpdateIssueProperties
      return await createOrUpdateIssueProperties({
        jobId: job.id,
        issueTypesMap,
        defaultIssueType,
        issueProperties: properties,
        planeClient,
        workspaceSlug: job.workspace_slug,
        projectId: job.project_id,
        method,
      });
    } catch (error) {
      logger.error(`[${job.id}][${this.name}] Unable to ${method} properties`, error);

      executionLog.collect(job.id, {
        entity_type: EExecutionLogEntityType.ISSUE_PROPERTY,
        phase: method === "create" ? "CREATE_PROPERTIES" : "UPDATE_PROPERTIES",
        level: EExecutionLogLevel.ERROR,
        error: extractErrorMetadata(error),
        additional_data: {
          attemptedCount: properties.length,
        },
      });

      throw error;
    }
  }

  /**
   * Build issue types map from Plane
   */
  /**
   * Build issue types map from dependency data (no API call)
   */
  private buildIssueTypesMap(issueTypesData: TIssueTypesData): Map<string, ExIssueType> {
    return new Map(
      issueTypesData.map((type) => [
        type.external_id,
        {
          id: type.id,
          external_id: type.external_id,
          name: type.name,
          is_epic: type.is_epic,
        } as ExIssueType,
      ])
    );
  }

  /**
   * Get default issue type from dependency data (no API call)
   */
  private getDefaultIssueType(issueTypesData: TIssueTypesData): ExIssueType | undefined {
    return issueTypesData.find((type) => type.is_default) as ExIssueType;
  }

  /**
   * Fetch existing properties from Plane
   */
  private async fetchExistingProperties(
    jobContext: TJobContext,
    issueTypesData: TIssueTypesData
  ): Promise<Map<string, ExIssueProperty>> {
    const { job, planeClient } = jobContext;
    const existingProperties = new Map<string, ExIssueProperty>();

    try {
      for (const issueType of issueTypesData) {
        const properties: ExIssueProperty[] = await withCache(
          `${this.name}:${issueType.id}`,
          job,
          async () => await planeClient.issueProperty.fetch(job.workspace_slug, job.project_id, issueType.id)
        );
        properties.forEach((prop) => existingProperties.set(prop.external_id, prop));
      }

      executionLog.collect(job.id, {
        entity_type: EExecutionLogEntityType.ISSUE_PROPERTY,
        phase: "FETCH_EXISTING_PROPERTIES",
        level: EExecutionLogLevel.INFO,
        metrics: {
          already_existed: existingProperties.size,
        },
        additional_data: {
          propertyNames: Array.from(existingProperties.values()).map((p) => p.display_name),
        },
      });

      logger.info(`[${job.id}] [${this.name}] Found existing properties`, {
        jobId: job.id,
        count: existingProperties.size,
      });
    } catch (error) {
      logger.error(`[${job.id}] [${this.name}] Error fetching existing properties`, { jobId: job.id, error });

      executionLog.collect(job.id, {
        entity_type: EExecutionLogEntityType.ISSUE_PROPERTY,
        phase: "FETCH_EXISTING_PROPERTIES",
        level: EExecutionLogLevel.ERROR,
        error: extractErrorMetadata(error),
      });
    }

    return existingProperties;
  }

  /**
   * Separate properties into create vs update
   */
  private separateCreateAndUpdate(
    properties: Partial<ExIssueProperty>[],
    existingProperties: Map<string, ExIssueProperty>
  ): { toCreate: Partial<ExIssueProperty>[]; toUpdate: Partial<ExIssueProperty>[] } {
    const toCreate = properties.filter((prop) => !existingProperties.has(prop.external_id || ""));

    const toUpdate = properties
      .filter((prop) => existingProperties.has(prop.external_id || ""))
      .map((prop) => ({
        ...existingProperties.get(prop.external_id || ""),
        ...prop,
      }));

    return { toCreate, toUpdate };
  }

  /**
   * Store properties mappings and raw data for options step
   */
  protected async storePropertiesData(
    // We need to pass the name of the step, as default properties step uses this function to store data
    name: EJiraStep,
    job: TImportJob,
    properties: ExIssueProperty[],
    storage: IStorageService
  ): Promise<void> {
    // Store mappings: external_id -> property_id
    const mappings = properties
      .filter((prop) => prop.external_id && prop.id)
      .map((prop) => ({
        externalId: prop.external_id,
        planeId: prop.id!,
      }));

    await storage.storeMapping(job.id, name, mappings);

    // Store raw data including original Jira fields for options step
    const propertiesData: TIssuePropertiesData = properties.map((prop) => ({
      id: prop.id!,
      external_id: prop.external_id,
      display_name: prop.display_name,
      property_type: prop.property_type,
      relation_type: prop.relation_type,
    }));

    await storage.storeData(job.id, name, propertiesData, "external_id");

    logger.info(`[${job.id}] [${this.name}] Stored mappings and data`, {
      jobId: job.id,
      mappingsCount: mappings.length,
    });
  }

  private async storeAdditionalData(
    job: TImportJob,
    storage: IStorageService,
    additionalData: {
      rawFields: JiraIssueField[];
    }
  ): Promise<void> {
    await storage.storeData(job.id, E_ADDITIONAL_STORAGE_KEYS.JIRA_RAW_FIELDS, additionalData.rawFields, "id");
  }
}
