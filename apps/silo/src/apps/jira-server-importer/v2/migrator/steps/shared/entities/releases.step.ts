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

import { EJiraStep } from "@/apps/jira-server-importer/v2/types";
import type {
  IStep,
  TJobContext,
  TStepExecutionContext,
  TStepExecutionInput,
} from "@/apps/jira-server-importer/v2/types";
import type { E_IMPORTER_KEYS } from "@plane/etl/core";
import { createHashForString } from "@/helpers/utils";
import type { JiraV2Service, JiraConfig } from "@plane/etl/jira-server";
import { pullVersions, getFormattedDate } from "@plane/etl/jira-server";
import { logger } from "@plane/logger";
import { createEmptyContext, createPaginationContext } from "@/apps/jira-server-importer/v2/helpers/ctx";
import { extractErrorMetadata } from "@/helpers/errors";
import { executionLog } from "@/lib/execution-log/service/execution-log.service";
import { EExecutionLogLevel, EExecutionLogEntityType } from "@/lib/execution-log/types";
import type { Version } from "jira.js/out/version2/models/index.js";
import type { ExRelease } from "@plane/sdk";
import { EReleaseStatus } from "@plane/sdk";
import type { TImportJob } from "@plane/types";
import { v4 as uuid } from "uuid";
import { getAPIClientInternal } from "@/services/client";

export class JiraReleasesStep implements IStep {
  name = EJiraStep.RELEASES;
  dependencies = [];
  private readonly PAGE_SIZE = 100;

  constructor(private readonly source: E_IMPORTER_KEYS.JIRA_SERVER | E_IMPORTER_KEYS.JIRA) {}

  async execute(input: TStepExecutionInput): Promise<TStepExecutionContext> {
    const { jobContext, previousContext, storage } = input;
    const { job, sourceClient } = jobContext;

    try {
      const startAt = previousContext?.pageCtx.startAt ?? 0;
      const totalProcessed = previousContext?.pageCtx.totalProcessed ?? 0;

      logger.info(`[${jobContext.job.id}] [${this.name}] Starting execution`, {
        jobId: job.id,
        startAt,
        totalProcessed,
      });

      const projectKey = job.config?.project?.key;
      if (!projectKey) {
        throw new Error("Project key not found in job config");
      }

      // Pull
      const pulled = await this.pull(sourceClient, projectKey, startAt, job.id);

      if (pulled.items.length === 0) {
        logger.info(`[${jobContext.job.id}] [${this.name}] No releases found`, { jobId: job.id });
        return createEmptyContext();
      }

      // Transform
      const transformed = this.transform(job, pulled.items as unknown as Version[]);

      // Push
      const pushedData = await this.push(jobContext, transformed);

      // Store Mapping
      const mappings = pushedData
        .filter((r) => r.external_id && r.id)
        .map((r) => ({
          externalId: r.external_id!,
          planeId: r.id!,
        }));

      await storage.storeMapping(job.id, this.name, mappings);

      return createPaginationContext({
        hasMore: pulled.hasMore,
        startAt,
        pageSize: this.PAGE_SIZE,
        pulled: pulled.items.length,
        pushed: pushedData.length,
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
   * Pull releases (versions) from Jira Server
   */
  private async pull(client: JiraV2Service, projectKey: string, startAt: number, jobId: string) {
    try {
      const result = await pullVersions(
        {
          client,
          startAt,
          maxResults: this.PAGE_SIZE,
        },
        projectKey
      );

      executionLog.collect(jobId, {
        entity_type: EExecutionLogEntityType.RELEASE,
        phase: "PULL_VERSIONS",
        level: EExecutionLogLevel.INFO,
        metrics: {
          pulled: result.items.length,
          total: result.total,
        },
      });

      logger.info(`[${jobId}] [${this.name}] Pulled versions`, {
        jobId,
        count: result.items.length,
        hasMore: result.hasMore,
        startAt,
      });

      return result;
    } catch (error) {
      logger.error(`[${jobId}][${this.name}] Unable to pull versions from Jira`, error);

      executionLog.collect(jobId, {
        entity_type: EExecutionLogEntityType.RELEASE,
        phase: "PULL_VERSIONS",
        level: EExecutionLogLevel.ERROR,
        error: extractErrorMetadata(error),
        is_fatal: true,
      });

      throw error;
    }
  }

  private transform(job: TImportJob<JiraConfig>, versions: Version[]): Partial<ExRelease>[] {
    const resourceId = job.config.resource ? job.config.resource.id : uuid();
    const workspaceSlug = job.workspace_slug;
    return versions.map((version) => {
      const versionNameInput = `${workspaceSlug}:${version.name?.trim().toLowerCase()}`;
      const hashedName = createHashForString(versionNameInput);

      return {
        // We are not using the project_id here as releases are workspace level
        // entities and not project level
        external_id: `${resourceId}_${hashedName}`, // We are using name here instead of id, as releases are unique by name in plane
        external_source: this.source,
        name: version.name ?? "Untitled",
        description_html: version.description ? `<p>${version.description}</p>` : undefined,
        status: version.released ? EReleaseStatus.RELEASED : EReleaseStatus.UNRELEASED,
        release_date: version.releaseDate ? getFormattedDate(version.releaseDate) : undefined,
        target_date: version.startDate ? getFormattedDate(version.startDate) : undefined,
      };
    });
  }

  private async push(jobContext: TJobContext, releases: Partial<ExRelease>[]): Promise<ExRelease[]> {
    const { job } = jobContext;
    const apiClient = getAPIClientInternal();
    const BATCH_SIZE = 50;
    const allResults: ExRelease[] = [];

    for (let i = 0; i < releases.length; i += BATCH_SIZE) {
      const chunk = releases.slice(i, i + BATCH_SIZE);
      try {
        const response = await apiClient.release.bulkCreateOrUpdateReleases(job.workspace_slug, chunk);
        allResults.push(...response.created, ...response.updated);

        executionLog.collect(job.id, {
          entity_type: EExecutionLogEntityType.RELEASE,
          phase: "PUSH_RELEASES",
          level: EExecutionLogLevel.INFO,
          metrics: {
            imported: response.created.length + response.updated.length,
          },
        });
      } catch (error) {
        executionLog.collect(job.id, {
          entity_type: EExecutionLogEntityType.RELEASE,
          phase: "PUSH_RELEASES",
          level: EExecutionLogLevel.ERROR,
          error: extractErrorMetadata(error),
        });
        throw error;
      }
    }
    return allResults;
  }
}
