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

import type { Sprint } from "jira.js/out/agile/models/index.js";
import { v4 as uuid } from "uuid";
import type { E_IMPORTER_KEYS } from "@plane/etl/core";
import type { JiraConfig, JiraSprint } from "@plane/etl/jira-server";
import { pullSprintsForBoardV2, transformSprint } from "@plane/etl/jira-server";
import { logger } from "@plane/logger";
import type { ExCycle } from "@plane/sdk";
import type { TImportJob } from "@plane/types";
import { createEmptyContext, createSuccessContext } from "@/apps/jira-server-importer/v2/helpers/ctx";
import type {
  IStep,
  IStorageService,
  TBoardData,
  TJobContext,
  TStepExecutionContext,
  TStepExecutionInput,
} from "@/apps/jira-server-importer/v2/types";
import { EJiraStep } from "@/apps/jira-server-importer/v2/types";
import { createAllCyclesV2 } from "@/etl/migrator/cycles.migrator";
import { extractErrorMetadata } from "@/helpers/errors";
import { executionLog } from "@/lib/execution-log/service/execution-log.service";
import { EExecutionLogLevel, EExecutionLogEntityType } from "@/lib/execution-log/types";

/**
 * Jira Server Sprints Step (Cycles in Plane)
 * Pulls sprints from boards with pagination, transforms to cycles, and pushes to Plane
 *
 * Dependencies: boards - board IDs to iterate through for sprint collection
 */
export class JiraCyclesStep implements IStep {
  name = EJiraStep.CYCLES;
  dependencies = [EJiraStep.BOARDS];

  private readonly PAGE_SIZE = 100;

  constructor(private readonly source: E_IMPORTER_KEYS.JIRA_SERVER | E_IMPORTER_KEYS.JIRA) {}

  /**
   * Executes the sprint extraction process:
   * 1. Extracts current board ID from dependency data
   * 2. Pulls sprints for the current board
   * 3. Transforms sprints to Plane cycles
   * 4. Pushes cycles to Plane and stores mappings
   * 5. Determines next action (continue board, next board, or complete)
   */
  async execute(input: TStepExecutionInput): Promise<TStepExecutionContext> {
    const { jobContext, storage, previousContext, dependencyData } = input;

    try {
      // Get current board ID - hides all board iteration logic
      const currentBoardId = this.extractCurrentBoardId(dependencyData, previousContext);
      if (!currentBoardId) {
        return this.handleNoMoreBoards(jobContext, previousContext);
      }

      const sprintsStartAt = previousContext?.state?.sprintsStartAt ?? 0;

      logger.info(`[${jobContext.job.id}] [${this.name}] Processing sprints`, {
        jobId: jobContext.job.id,
        boardId: currentBoardId,
        startAt: sprintsStartAt,
      });

      const pulled = await this.pull(jobContext, currentBoardId, sprintsStartAt);
      const transformed = this.transform(jobContext.job, pulled.items);
      const pushed = await this.push(jobContext, transformed, storage);

      // Determine next recordType: more sprints? next board? done?
      return this.determineNextContext(input, pulled, pushed);
    } catch (error) {
      logger.error(`[${jobContext.job.id}] [${this.name}] Step failed`, {
        jobId: jobContext.job.id,
        error: error,
      });
      throw error;
    }
  }

  /**
   * Extract current board ID from dependency data and state
   * Returns null if no more boards to process
   */
  private extractCurrentBoardId(
    dependencyData: Record<string, unknown> | undefined,
    previousContext: TStepExecutionContext | undefined
  ): number | null {
    const boards = dependencyData?.boards as TBoardData;
    if (!boards || boards.length === 0) {
      return null;
    }

    const currentBoardIndex = previousContext?.state?.currentBoardIndex ?? 0;

    // Check if we've exhausted all boards
    if (currentBoardIndex >= boards.length) {
      return null;
    }

    return boards[currentBoardIndex].id;
  }

  /**
   * Handle case when no more boards to process
   */
  private handleNoMoreBoards(
    jobCtx: TJobContext,
    previousContext: TStepExecutionContext | undefined
  ): TStepExecutionContext {
    const totalProcessed = previousContext?.pageCtx.totalProcessed ?? 0;

    logger.info(`[${jobCtx.job.id}] [${this.name}] No more boards to process`, {
      jobId: jobCtx.job.id,
      totalProcessed,
    });

    if (totalProcessed === 0) {
      return createEmptyContext();
    }

    return createSuccessContext({ pulled: 0, pushed: 0, totalProcessed });
  }

  /**
   * Pull sprints from Jira Server for a specific board
   */
  private async pull(jobCtx: TJobContext, boardId: number, startAt: number) {
    try {
      const result = await pullSprintsForBoardV2(
        {
          client: jobCtx.sourceClient,
          startAt,
          maxResults: this.PAGE_SIZE,
        },
        boardId
      );

      executionLog.collect(jobCtx.job.id, {
        entity_type: EExecutionLogEntityType.CYCLE,
        phase: "PULL_SPRINTS",
        level: EExecutionLogLevel.INFO,
        related_entity: boardId.toString(),
        metrics: {
          total: result.total,
          pulled: result.items.length,
        },
      });

      logger.info(`[${jobCtx.job.id}] [${this.name}] Pulled sprints`, {
        jobId: jobCtx.job.id,
        boardId,
        count: result.items.length,
        hasMore: result.hasMore,
        startAt,
      });

      return result;
    } catch (error) {
      logger.error(`[${jobCtx.job.id}][${this.name}] Unable to pull sprints from Jira`, error);

      executionLog.collect(jobCtx.job.id, {
        entity_type: EExecutionLogEntityType.CYCLE,
        phase: "PULL_SPRINTS",
        level: EExecutionLogLevel.ERROR,
        error: extractErrorMetadata(error),
        related_entity: boardId.toString(),
        is_fatal: true,
      });

      throw error;
    }
  }

  /**
   * Transform Jira sprints to Plane cycles
   */
  private transform(job: TImportJob<JiraConfig>, jiraSprints: Sprint[]): Partial<ExCycle>[] {
    if (jiraSprints.length === 0) return [];

    const resourceId = job.config.resource ? job.config.resource.id : uuid();

    // Convert Sprint to JiraSprint format expected by transformSprint
    const formattedSprints: JiraSprint[] = jiraSprints.map((sprint) => ({
      sprint,
      issues: [], // Issues are handled in separate step
    }));

    return formattedSprints.map((sprint) =>
      transformSprint(
        {
          resourceId,
          projectId: job.project_id,
          source: this.source,
        },
        sprint
      )
    );
  }

  /**
   * Push cycles to Plane and store mappings
   */
  private async push(jobContext: TJobContext, cycles: Partial<ExCycle>[], storage: IStorageService): Promise<number> {
    if (cycles.length === 0) return 0;

    const { job, planeClient } = jobContext;

    try {
      // Create cycles in Plane (without issues - issues handled in separate step)
      // Summary is collected inside createAllCyclesV2
      const created = await createAllCyclesV2(
        job.id,
        cycles as ExCycle[],
        planeClient,
        job.workspace_slug,
        job.project_id
      );

      logger.info(`[${job.id}] [${this.name}] Pushed cycles`, {
        jobId: job.id,
        count: created?.length ?? 0,
      });

      // Store mappings: sprint_external_id -> cycle_id
      const mappings = created
        ?.map((c) => ({
          externalId: c.external_id,
          planeId: c.id,
        }))
        .filter((m) => m.externalId && m.planeId);

      await storage.storeMapping(job.id, this.name, mappings ?? []);

      return created?.length ?? 0;
    } catch (error) {
      logger.error(`[${job.id}][${this.name}] Unable to push cycles to Plane`, error);

      executionLog.collect(job.id, {
        entity_type: EExecutionLogEntityType.CYCLE,
        phase: "PUSH_CYCLES",
        level: EExecutionLogLevel.ERROR,
        error: extractErrorMetadata(error),
        additional_data: {
          attemptedCount: cycles.length,
        },
      });

      throw error;
    }
  }

  /**
   * Determine next context based on pagination state
   * Decides: continue current board? move to next board? or finish?
   */
  private determineNextContext(
    input: TStepExecutionInput,
    pulled: { items: Sprint[]; hasMore: boolean },
    pushed: number
  ): TStepExecutionContext {
    const { previousContext, dependencyData } = input;
    const boards = dependencyData?.boards as TBoardData;

    const currentBoardIndex = previousContext?.state?.currentBoardIndex ?? 0;
    const sprintsStartAt = previousContext?.state?.sprintsStartAt ?? 0;
    const totalProcessed = previousContext?.pageCtx.totalProcessed ?? 0;
    const newTotalProcessed = totalProcessed + pulled.items.length;

    // Case 1: More sprints for current board
    if (pulled.hasMore) {
      return {
        pageCtx: {
          startAt: sprintsStartAt + pulled.items.length,
          hasMore: true,
          totalProcessed: newTotalProcessed,
        },
        results: {
          pulled: pulled.items.length,
          pushed,
          errors: [],
        },
        state: {
          currentBoardIndex,
          sprintsStartAt: sprintsStartAt + pulled.items.length,
        },
      };
    }

    // Case 2: Current board done, more boards available
    if (currentBoardIndex + 1 < boards.length) {
      return {
        pageCtx: {
          startAt: 0,
          hasMore: true,
          totalProcessed: newTotalProcessed,
        },
        results: {
          pulled: pulled.items.length,
          pushed,
          errors: [],
        },
        state: {
          currentBoardIndex: currentBoardIndex + 1,
          sprintsStartAt: 0,
        },
      };
    }

    // Case 3: All boards processed
    return createSuccessContext({
      pulled: pulled.items.length,
      pushed,
      totalProcessed: newTotalProcessed,
    });
  }
}
