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
import type { E_IMPORTER_KEYS } from "@plane/etl/core";
import { logger } from "@plane/logger";
import { createEmptyContext } from "@/apps/jira-server-importer/v2/helpers/ctx";
import type {
  IStep,
  TIssueRelationsData,
  TStepExecutionContext,
  TStepExecutionInput,
} from "@/apps/jira-server-importer/v2/types";
import { E_ADDITIONAL_STORAGE_KEYS, EJiraStep } from "@/apps/jira-server-importer/v2/types";
import { celeryProducer } from "@/worker";
import { extractErrorMetadata } from "@/helpers/errors";
import { executionLog } from "@/lib/execution-log/service/execution-log.service";
import { EExecutionLogLevel, EExecutionLogEntityType } from "@/lib/execution-log/types";

/**
 * Relations Step
 *
 * Retrieves all accumulated relations from storage and sends to Celery in one batch
 * Only handles relationships (parent, blocking, etc) - cycles/modules already handled
 */
export class JiraRelationsStep implements IStep {
  name = EJiraStep.RELATIONS;
  dependencies = [];
  constructor(private readonly source: E_IMPORTER_KEYS.JIRA_SERVER | E_IMPORTER_KEYS.JIRA) {}

  async execute(input: TStepExecutionInput): Promise<TStepExecutionContext> {
    const { jobContext, storage } = input;
    const { job, credentials } = jobContext;

    try {
      logger.info(`[${jobContext.job.id}] [${this.name}] Starting execution`, { jobId: job.id });

      // Retrieve all relations from storage
      const allRelations = await storage.retrieveData<TIssueRelationsData[]>(
        job.id,
        E_ADDITIONAL_STORAGE_KEYS.JIRA_ISSUE_RELATIONS
      );

      if (!allRelations || allRelations.length === 0) {
        logger.info(`[${jobContext.job.id}] [${this.name}] No relations found`, { jobId: job.id });

        executionLog.collect(job.id, {
          entity_type: EExecutionLogEntityType.WORK_ITEM_RELATIONS,
          phase: "RETRIEVE_RELATIONS",
          level: EExecutionLogLevel.INFO,
          additional_data: {
            message: "No relations found in storage",
          },
        });

        return createEmptyContext();
      }

      // Filter out relations with no actual relationships
      const relationsWithRelationships = allRelations.filter((rel) => {
        const r = rel.relationships;
        return (
          r.parent ||
          r.blocking?.length > 0 ||
          r.is_blocked_by?.length > 0 ||
          r.relates_to?.length > 0 ||
          r.duplicate_of
        );
      });

      executionLog.collect(job.id, {
        entity_type: EExecutionLogEntityType.WORK_ITEM_RELATIONS,
        phase: "RETRIEVE_RELATIONS",
        level: EExecutionLogLevel.INFO,
        metrics: {
          pulled: allRelations.length,
        },
        additional_data: {
          totalRelationsRetrieved: allRelations.length,
          relationsWithRelationships: relationsWithRelationships.length,
        },
      });

      if (relationsWithRelationships.length === 0) {
        logger.info(`[${jobContext.job.id}] [${this.name}] No relationships to process`, { jobId: job.id });
        return createEmptyContext();
      }

      // Strip out associations (cycles/modules) - only send relationships
      const relationshipsOnly = relationsWithRelationships.map((rel) => ({
        external_id: rel.external_id,
        relationships: rel.relationships,
      }));

      // Send all to Celery in one batch
      await celeryProducer.registerTask(
        {
          relations_batch: relationshipsOnly,
          job_id: job.id,
          workspace_id: job.workspace_id,
          project_id: job.project_id,
          source: this.source,
          user_id: credentials.user_id,
        },
        job.workspace_slug,
        job.project_id,
        job.id,
        credentials.user_id,
        uuidv4(),
        "plane.silo.bgtasks.bulk_update_issue_relations_task_v2.bulk_update_issue_relations_task_v2"
      );

      executionLog.collect(job.id, {
        entity_type: EExecutionLogEntityType.WORK_ITEM_RELATIONS,
        phase: "SEND_RELATIONS_TO_CELERY",
        level: EExecutionLogLevel.SUCCESS,
        additional_data: {
          relationsSent: relationshipsOnly.length,
        },
      });

      logger.info(`[${jobContext.job.id}] [${this.name}] Sent all relations to Celery`, {
        jobId: job.id,
        totalRelations: relationshipsOnly.length,
      });

      return createEmptyContext();
    } catch (error) {
      logger.error(`[${jobContext.job.id}] [${this.name}] Step failed`, {
        jobId: job.id,
        error: error instanceof Error ? error.message : String(error),
      });

      executionLog.collect(job.id, {
        entity_type: EExecutionLogEntityType.WORK_ITEM_RELATIONS,
        phase: "SEND_RELATIONS_TO_CELERY",

        level: EExecutionLogLevel.ERROR,
        error: extractErrorMetadata(error),
      });

      throw error;
    }
  }
}
