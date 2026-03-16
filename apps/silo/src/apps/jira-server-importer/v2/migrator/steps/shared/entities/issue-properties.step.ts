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
import type { ExIssueProperty, ExIssuePropertyOption, ExIssueType } from "@plane/sdk";
import type { TImportJob } from "@plane/types";
import { createEmptyContext, createSuccessContext } from "@/apps/jira-server-importer/v2/helpers/ctx";
import { extractJobData } from "@/apps/jira-server-importer/v2/helpers/job";
import { getSupportedDefaultProperties } from "@/apps/jira-server-importer/v2/helpers/properties";
import type {
  IStep,
  IStorageService,
  TDefaultPropertyData,
  TIssuePropertiesData,
  TIssueTypesData,
  TJobContext,
  TKnownFieldMapping,
  TStepExecutionContext,
  TStepExecutionInput,
} from "@/apps/jira-server-importer/v2/types";
import { E_ADDITIONAL_STORAGE_KEYS, EJiraStep } from "@/apps/jira-server-importer/v2/types";
import { getAPIClientInternal } from "@/services/client";
import { extractErrorMetadata } from "@/helpers/errors";
import { executionLog } from "@/lib/execution-log/service/execution-log.service";
import { EExecutionLogLevel, EExecutionLogEntityType } from "@/lib/execution-log/types";
import { KNOWN_CUSTOM_FIELDS } from "@/apps/jira-server-importer/v2/helpers/constants";
import type { IKnownCustomFieldMatcher } from "@/apps/jira-server-importer/v2/helpers/constants";
import type { Resolution } from "jira.js/out/version2/models";

const EXCLUDED_CUSTOM_FIELDS = [
  ...KNOWN_CUSTOM_FIELDS.START_DATE.names,
  ...KNOWN_CUSTOM_FIELDS.SPRINT.names,
  ...KNOWN_CUSTOM_FIELDS.STORY_POINTS.names,
] as string[];

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
      const defaultProperties = await this.generateDefaultProperties(job, storage, issueTypesData);
      const knownCustomFieldMapping = this.extractKnownCustomFields(pulled);
      const filteredPulled = this.removeKnownCustomFields(pulled);

      await this.storeAdditionalData(jobContext.job, storage, { rawFields: filteredPulled, knownCustomFieldMapping });

      if (filteredPulled.length === 0) {
        logger.info(`[${jobContext.job.id}] [${this.name}] No custom fields found`, { jobId: job.id });
        return createEmptyContext();
      }

      const transformed = this.transform(job, filteredPulled);
      const allProperties = [...transformed, ...defaultProperties];
      const pushed = await this.push(jobContext, allProperties, issueTypesData);

      await this.storePropertiesData(this.name, jobContext.job, pushed, storage);

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
   * Generate default properties for each issue type
   * Creates properties like fixVersion, Version, Reporter, etc.
   */
  private async generateDefaultProperties(
    job: TImportJob<JiraConfig>,
    storage: IStorageService,
    issueTypesData: TIssueTypesData
  ): Promise<Partial<ExIssueProperty>[]> {
    const { resourceId, projectId } = extractJobData(job);
    const defaultProperties: Partial<ExIssueProperty>[] = [];
    const propertyData = await this.getDefaultPropertyData(job.id, storage);

    for (const issueType of issueTypesData) {
      const properties = getSupportedDefaultProperties(
        resourceId,
        projectId,
        issueType.id,
        issueType.external_id,
        this.source,
        propertyData
      );
      defaultProperties.push(...properties);
    }

    logger.info(`[${job.id}] [${this.name}] Generated default properties`, {
      jobId: job.id,
      count: defaultProperties.length,
    });

    return defaultProperties;
  }

  private async getDefaultPropertyData(jobId: string, storage: IStorageService): Promise<TDefaultPropertyData> {
    const resolutions = await storage.retrieveData(jobId, EJiraStep.RESOLUTIONS);
    return {
      resolutions: resolutions as Resolution[],
    };
  }

  /**
   * Push properties to Plane using bulk API
   */
  protected async push(
    jobContext: TJobContext,
    properties: Partial<ExIssueProperty>[],
    issueTypesData: TIssueTypesData
  ): Promise<ExIssueProperty[]> {
    const { job } = jobContext;
    const issueTypesMap = this.buildIssueTypesMap(issueTypesData);

    // Group properties by issue type
    const propertiesByType = new Map<string, Partial<ExIssueProperty>[]>();

    for (const property of properties) {
      const issueType = issueTypesMap.get(property.type_id || "");

      if (issueType) {
        const typeId = issueType.id ?? "";

        if (!propertiesByType.has(typeId)) {
          propertiesByType.set(typeId, []);
        }

        // Set the correct type_id
        property.type_id = typeId;
        propertiesByType.get(typeId)!.push(property);
      } else {
        logger.warn(`[${job.id}] Issue Properties, issue type not found`, {
          type_id: property.type_id,
          issue_type_map: issueTypesMap,
        });
      }
    }

    // Process each issue type's properties using bulk API
    const apiClient = getAPIClientInternal();
    const allProperties: ExIssueProperty[] = [];
    const allErrors: Array<{ payload: Partial<ExIssueProperty>; error: string }> = [];

    const BATCH_SIZE = 50;

    for (const [typeId, typeProperties] of propertiesByType.entries()) {
      try {
        logger.info(`[${job.id}] [${this.name}] Starting bulk operation for type ${typeId}`, {
          jobId: job.id,
          typeId,
          totalCount: typeProperties.length,
          batchSize: BATCH_SIZE,
        });

        let typeCreatedCount = 0;
        let typeUpdatedCount = 0;
        let typeErroredCount = 0;
        const typeCreatedNames: string[] = [];

        for (let i = 0; i < typeProperties.length; i += BATCH_SIZE) {
          const chunk = typeProperties.slice(i, i + BATCH_SIZE);

          logger.info(`[${job.id}] [${this.name}] Processing batch for type ${typeId}`, {
            jobId: job.id,
            typeId,
            batchRange: `${i + 1}-${Math.min(i + BATCH_SIZE, typeProperties.length)}`,
            total: typeProperties.length,
          });

          const result = await apiClient.workItemProperty.bulkCreateOrUpdateIssueProperties(
            job.workspace_slug,
            job.project_id,
            typeId,
            chunk
          );

          allProperties.push(...result.created, ...result.updated);
          allErrors.push(...result.errored);

          // Update type-level metrics
          typeCreatedCount += result.created.length;
          typeUpdatedCount += result.updated.length;
          typeErroredCount += result.errored.length;
          typeCreatedNames.push(...result.created.map((p) => p.display_name));
        }

        logger.info(`[${job.id}] [${this.name}] Bulk operation completed for type ${typeId}`, {
          jobId: job.id,
          typeId,
          created: typeCreatedCount,
          updated: typeUpdatedCount,
          errored: typeErroredCount,
        });

        executionLog.collect(job.id, {
          entity_type: EExecutionLogEntityType.ISSUE_PROPERTY,
          phase: "CREATE_PROPERTIES",
          level: EExecutionLogLevel.INFO,
          metrics: {
            imported: typeCreatedCount,
            errored: typeErroredCount,
          },
          additional_data: {
            propertyNames: typeCreatedNames,
          },
        });
      } catch (error) {
        logger.error(`[${job.id}] [${this.name}] Error in bulk operation for type ${typeId}`, {
          jobId: job.id,
          typeId,
          error: error instanceof Error ? error.message : String(error),
        });
        // Add all properties for this type to errors
        typeProperties.forEach((prop) => {
          allErrors.push({
            payload: prop,
            error: error instanceof Error ? error.message : String(error),
          });
        });
      }
    }

    if (allErrors.length > 0) {
      logger.warn(`[${job.id}] [${this.name}] Some properties failed to create/update`, {
        jobId: job.id,
        errorCount: allErrors.length,
        errors: allErrors,
      });
      // Generate execution log for each error
      allErrors.forEach((error) => {
        executionLog.collect(job.id, {
          entity_type: EExecutionLogEntityType.ISSUE_PROPERTY,
          phase: "CREATE_PROPERTIES",
          level: EExecutionLogLevel.ERROR,
          error: {
            message: error.error,
            payload: error.payload,
          },
          additional_data: {
            propertyNames: [error.payload.display_name],
          },
        });
      });
    }

    return allProperties;
  }

  /**
   * @param jiraFields
   * @returns knownCustomFieldMapping
   */
  protected extractKnownCustomFields(jiraFields: JiraIssueField[]): TKnownFieldMapping[] {
    const extractedKnownCustomFields: TKnownFieldMapping[] = [];

    for (const field of jiraFields) {
      if (!field.name) continue;

      for (const [key, m] of Object.entries(KNOWN_CUSTOM_FIELDS)) {
        const matcher = m as IKnownCustomFieldMatcher;
        const isNameMatch = matcher.names?.some((name: string) => name.toLowerCase() === field.name?.toLowerCase());
        const isTypeMatch = matcher.customTypes?.some((type: string) => type === field.schema?.custom);

        if (isNameMatch || isTypeMatch) {
          extractedKnownCustomFields.push({
            name: key as keyof typeof KNOWN_CUSTOM_FIELDS,
            data: field,
          });
        }
      }
    }
    logger.info("[Jira] Extracted known custom fields", extractedKnownCustomFields);

    return extractedKnownCustomFields;
  }

  /**
   * @param jiraFields
   * @returns
   */
  protected removeKnownCustomFields(jiraFields: JiraIssueField[]): JiraIssueField[] {
    return jiraFields.filter((field) => {
      return !field.name || !EXCLUDED_CUSTOM_FIELDS.includes(field.name);
    });
  }

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
      options: prop.options as Partial<ExIssuePropertyOption>[],
    }));

    await storage.storeData(job.id, name, propertiesData, ["external_id"]);

    // Extract and store options separately for backward compatibility with issues step
    const allOptions = properties.flatMap((prop) => prop.options || []);
    if (allOptions.length > 0) {
      const optionMappings = allOptions
        .filter((option) => option.external_id && option.id)
        .map((option) => ({
          externalId: option.external_id!,
          planeId: option.id!,
        }));

      await storage.storeMapping(job.id, EJiraStep.ISSUE_PROPERTY_OPTIONS, optionMappings);
      await storage.storeData(job.id, EJiraStep.ISSUE_PROPERTY_OPTIONS, allOptions, ["external_id"]);

      logger.info(`[${job.id}] [${this.name}] Stored options mappings and data`, {
        jobId: job.id,
        optionsCount: allOptions.length,
      });
    }

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
      knownCustomFieldMapping: TKnownFieldMapping[];
    }
  ): Promise<void> {
    await storage.storeData(job.id, E_ADDITIONAL_STORAGE_KEYS.JIRA_RAW_FIELDS, additionalData.rawFields, [
      "id",
      "scope.type",
    ]);

    await storage.storeData(
      job.id,
      E_ADDITIONAL_STORAGE_KEYS.JIRA_KNOWN_FIELD_MAPPING,
      additionalData.knownCustomFieldMapping,
      ["name", "data.id"]
    );
  }
}
