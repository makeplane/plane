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
import type { JiraConfig, JiraCustomFieldKeys, JiraIssueField } from "@plane/etl/jira-server";
import { OPTION_CUSTOM_FIELD_TYPES, transformIssueFieldOptions } from "@plane/etl/jira-server";
import { logger } from "@plane/logger";
import type { ExIssueProperty, ExIssuePropertyOption } from "@plane/sdk";
import type { TImportJob } from "@plane/types";
import { withCache } from "@/apps/jira-server-importer/v2/helpers/cache";
import { createEmptyContext, createSuccessContext } from "@/apps/jira-server-importer/v2/helpers/ctx";
import type {
  IStep,
  IStorageService,
  TIssuePropertiesData,
  TJobContext,
  TStepExecutionContext,
  TStepExecutionInput,
} from "@/apps/jira-server-importer/v2/types";
import { E_ADDITIONAL_STORAGE_KEYS, EJiraStep } from "@/apps/jira-server-importer/v2/types";
import { createOrUpdateIssuePropertiesOptions } from "@/etl/migrator/issue-types/issue-property.migrator";
import { extractErrorMetadata } from "@/helpers/errors";
import { executionLog } from "@/lib/execution-log/service/execution-log.service";
import { EExecutionLogLevel, EExecutionLogEntityType } from "@/lib/execution-log/types";

/**
 * Jira Server Issue Property Options Step
 * Extracts options from custom fields and pushes to Plane
 *
 * Note: Only processes select/multi-select fields
 */
export class JiraIssuePropertyOptionsStep implements IStep {
  name = EJiraStep.ISSUE_PROPERTY_OPTIONS;
  dependencies = [EJiraStep.ISSUE_PROPERTIES];

  constructor(private readonly source: E_IMPORTER_KEYS.JIRA_SERVER | E_IMPORTER_KEYS.JIRA) {}

  async execute(input: TStepExecutionInput): Promise<TStepExecutionContext> {
    const { jobContext, storage, dependencyData } = input;
    const { job } = jobContext;

    try {
      // Load properties from dependency
      const propertiesData = dependencyData?.issue_properties as TIssuePropertiesData;
      const rawFields = await storage.retrieveData<JiraIssueField[]>(job.id, E_ADDITIONAL_STORAGE_KEYS.JIRA_RAW_FIELDS);
      if (!rawFields || rawFields.length === 0) {
        logger.info(`[${jobContext.job.id}] [${this.name}] No raw fields found, skipping options`, { jobId: job.id });
        return createEmptyContext();
      }

      logger.info(`[${jobContext.job.id}] [${this.name}] Starting execution`, { jobId: job.id });

      // Extract options from raw fields
      const transformed = this.transform(job, rawFields);

      if (transformed.length === 0) {
        logger.info(`[${jobContext.job.id}] [${this.name}] No options found`, { jobId: job.id });
        return createEmptyContext();
      }

      // Push to Plane
      const pushed = await this.push(jobContext, transformed, propertiesData, storage);

      logger.info(`[${jobContext.job.id}] [${this.name}] Completed`, {
        jobId: job.id,
        pushed: pushed.length,
      });

      return createSuccessContext({
        pulled: transformed.length,
        pushed: pushed.length,
        totalProcessed: transformed.length,
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
   * Transform Jira field options to Plane property options
   * Only extracts options from select/multi-select fields
   */
  private transform(job: TImportJob<JiraConfig>, rawFields: JiraIssueField[]): Partial<ExIssuePropertyOption>[] {
    const resourceId = job.config.resource ? job.config.resource.id : uuid();

    const optionFields = rawFields.filter(
      (field) => field.schema?.custom && OPTION_CUSTOM_FIELD_TYPES.includes(field.schema.custom as JiraCustomFieldKeys)
    );

    const options = optionFields
      .flatMap(
        (field) =>
          field.options?.map((option) =>
            transformIssueFieldOptions({ resourceId, projectId: job.project_id, source: this.source }, option)
          ) || []
      )
      .filter(Boolean);

    executionLog.collect(job.id, {
      entity_type: EExecutionLogEntityType.ISSUE_PROPERTY_OPTION,
      phase: "TRANSFORM_OPTIONS",
      level: EExecutionLogLevel.INFO,
      metrics: {
        total: options.length,
        pulled: options.length,
      },
    });

    logger.info(`[${job.id}] [${this.name}] Transformed options`, {
      jobId: job.id,
      count: options.length,
    });

    return options;
  }

  /**
   * Push options to Plane and store mappings
   */
  private async push(
    jobContext: TJobContext,
    options: Partial<ExIssuePropertyOption>[],
    propertiesData: TIssuePropertiesData,
    storage: IStorageService
  ): Promise<ExIssuePropertyOption[]> {
    const { job } = jobContext;

    // Build properties map from dependency data (no API calls)
    const propertiesMap = this.buildPropertiesMap(propertiesData);

    // Fetch existing options
    const existingOptions = await this.fetchExistingOptions(jobContext, propertiesData);

    // Separate create vs update
    const { toCreate, toUpdate } = this.separateCreateAndUpdate(options, existingOptions);

    // Create and update
    const created = await this.putOptions(jobContext, toCreate, propertiesMap, "create");
    const updated = await this.putOptions(jobContext, toUpdate, propertiesMap, "update");

    const allOptions = [...created, ...updated];

    // Store mappings
    await this.storeOptionsData(job, allOptions, storage);

    return allOptions;
  }

  /**
   * Create or update options in Plane
   */
  private async putOptions(
    jobContext: TJobContext,
    options: Partial<ExIssuePropertyOption>[],
    propertiesMap: Map<string, ExIssueProperty>,
    method: "create" | "update"
  ): Promise<ExIssuePropertyOption[]> {
    if (options.length === 0) return [];

    const { job, planeClient } = jobContext;

    logger.info(`[${job.id}] [${this.name}] Putting Options: ${method} mode`, {
      jobId: job.id,
      count: options.length,
    });

    try {
      // Summary is collected inside createOrUpdateIssuePropertiesOptions
      return await createOrUpdateIssuePropertiesOptions({
        jobId: job.id,
        issuePropertyMap: propertiesMap,
        issuePropertiesOptions: options,
        planeClient,
        workspaceSlug: job.workspace_slug,
        projectId: job.project_id,
        method,
      });
    } catch (error) {
      logger.error(`[${job.id}][${this.name}] Unable to ${method} options`, error);

      executionLog.collect(job.id, {
        entity_type: EExecutionLogEntityType.ISSUE_PROPERTY_OPTION,
        phase: method === "create" ? "CREATE_OPTIONS" : "UPDATE_OPTIONS",
        level: EExecutionLogLevel.ERROR,
        error: extractErrorMetadata(error),
        additional_data: {
          attemptedCount: options.length,
        },
      });

      throw error;
    }
  }

  /**
   * Build properties map from dependency data (no API call)
   */
  private buildPropertiesMap(propertiesData: TIssuePropertiesData): Map<string, ExIssueProperty> {
    return new Map(
      propertiesData.map((prop) => [
        prop.external_id,
        {
          id: prop.id,
          external_id: prop.external_id,
          display_name: prop.display_name,
          property_type: prop.property_type,
        } as ExIssueProperty,
      ])
    );
  }

  /**
   * Fetch existing options from Plane
   */
  private async fetchExistingOptions(
    jobContext: TJobContext,
    propertiesData: TIssuePropertiesData
  ): Promise<Map<string, ExIssuePropertyOption>> {
    const { job, planeClient } = jobContext;
    const existingOptions = new Map<string, ExIssuePropertyOption>();

    try {
      // Only fetch options for properties with type "OPTION"
      const optionProperties = propertiesData.filter((prop) => prop.property_type === "OPTION");

      for (const property of optionProperties) {
        const options: ExIssuePropertyOption[] = await withCache(
          this.name,
          job,
          async () => await planeClient.issuePropertyOption.fetch(job.workspace_slug, job.project_id, property.id)
        );
        options.forEach((option) => existingOptions.set(option.external_id, option));
      }

      executionLog.collect(job.id, {
        entity_type: EExecutionLogEntityType.ISSUE_PROPERTY_OPTION,
        phase: "FETCH_EXISTING_OPTIONS",
        level: EExecutionLogLevel.INFO,
        metrics: {
          already_existed: existingOptions.size,
        },
        additional_data: {
          optionPropertiesCount: optionProperties.length,
        },
      });

      logger.info(`[${job.id}] [${this.name}] Found existing options`, {
        jobId: job.id,
        count: existingOptions.size,
      });
    } catch (error) {
      logger.error(`[${job.id}] [${this.name}] Error fetching existing options`, { jobId: job.id, error });

      executionLog.collect(job.id, {
        entity_type: EExecutionLogEntityType.ISSUE_PROPERTY_OPTION,
        phase: "FETCH_EXISTING_OPTIONS",
        level: EExecutionLogLevel.ERROR,
        error: extractErrorMetadata(error),
      });
    }

    return existingOptions;
  }

  /**
   * Separate options into create vs update
   */
  private separateCreateAndUpdate(
    options: Partial<ExIssuePropertyOption>[],
    existingOptions: Map<string, ExIssuePropertyOption>
  ): { toCreate: Partial<ExIssuePropertyOption>[]; toUpdate: Partial<ExIssuePropertyOption>[] } {
    const toCreate = options.filter((option) => !existingOptions.has(option.external_id?.toString() || ""));

    const toUpdate = options
      .filter((option) => existingOptions.has(option.external_id?.toString() || ""))
      .map((option) => ({
        ...existingOptions.get(option.external_id?.toString() || ""),
        ...option,
      }));

    return { toCreate, toUpdate };
  }

  /**
   * Store options mappings
   */
  private async storeOptionsData(
    job: TImportJob,
    options: ExIssuePropertyOption[],
    storage: IStorageService
  ): Promise<void> {
    const mappings = options
      .filter((option) => option.external_id && option.id)
      .map((option) => ({
        externalId: option.external_id,
        planeId: option.id!,
      }));

    await storage.storeMapping(job.id, this.name, mappings);
    await storage.storeData(job.id, this.name, options, "external_id");

    logger.info(`[${job.id}] [${this.name}] Stored mappings`, {
      jobId: job.id,
      count: mappings.length,
    });
  }
}
