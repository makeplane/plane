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

import type { Board } from "jira.js/out/agile/models/index.js";
import type { JiraConfig, JiraV2Service, PaginatedResult } from "@plane/etl/jira-server";
import { pullBoardsV2 } from "@plane/etl/jira-server";
import { logger } from "@plane/logger";
import type { TImportJob } from "@plane/types";
import {
  createContinueContext,
  createEmptyContext,
  createSuccessContext,
} from "@/apps/jira-server-importer/v2/helpers/ctx";
import type {
  IStep,
  IStorageService,
  TBoardData,
  TStepExecutionContext,
  TStepExecutionInput,
} from "@/apps/jira-server-importer/v2/types";
import { EJiraStep } from "@/apps/jira-server-importer/v2/types";
import { extractErrorMetadata } from "@/helpers/errors";
import { executionLog } from "@/lib/execution-log/service/execution-log.service";
import { EExecutionLogLevel, EExecutionLogEntityType } from "@/lib/execution-log/types";

/**
 * Handles the extraction of boards from Jira Server.
 *
 * This step pulls all boards from Jira Server in a paginated manner and stores them
 * for use by dependent steps. Boards are accumulated across pages and stored once
 * all pages have been fetched.
 *
 * Note: Boards are not created as entities in Plane, only stored as reference data
 * for mapping issues to modules/views. If future requirements need board entities
 * in Plane, add transform/push logic here.
 */
export class JiraBoardsStep implements IStep {
  name = EJiraStep.BOARDS;
  dependencies = [];

  private readonly PAGE_SIZE = 100;

  /**
   * Executes the board extraction process:
   * 1. Retrieves pagination context
   * 2. Pulls boards from Jira Server
   * 3. Stores boards in Redis
   * 4. Continues to next page or completes
   */
  async execute(input: TStepExecutionInput): Promise<TStepExecutionContext> {
    const { jobContext, storage, previousContext } = input;
    const { job, sourceClient } = jobContext;

    try {
      const { startAt, totalProcessed } = this.getPaginationContext(previousContext);
      const projectId = this.getProjectId(job);

      logger.info(`[${job.id}] [${this.name}] Pulling boards`, { startAt, totalProcessed });

      const result = await this.pullBoards(sourceClient, projectId, startAt, job.id);
      const scrumBoards = result.items.filter((board) => board.type === "scrum");

      if (this.shouldReturnEmpty(result, startAt)) {
        return createEmptyContext();
      }

      await this.storeBoards(storage, job.id, scrumBoards);

      const newTotalProcessed = totalProcessed + result.items.length;

      return this.buildNextContext(result, startAt, newTotalProcessed);
    } catch (error) {
      logger.error(`[${job.id}] [${this.name}] Step failed`, {
        jobId: job.id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Extracts pagination state from previous context
   */
  private getPaginationContext(previousContext?: TStepExecutionContext) {
    return {
      startAt: previousContext?.pageCtx.startAt ?? 0,
      totalProcessed: previousContext?.pageCtx.totalProcessed ?? 0,
    };
  }

  /**
   * Extracts and validates project ID from job configuration
   */
  private getProjectId(job: TImportJob<JiraConfig>): string {
    const projectId = job.config?.project?.id;
    if (!projectId) {
      throw new Error("Project ID not found in job config");
    }
    return projectId;
  }

  /**
   * Pulls a page of boards from Jira Server
   */
  private async pullBoards(client: JiraV2Service, projectId: string, startAt: number, jobId: string) {
    try {
      const result = await pullBoardsV2(
        {
          client,
          startAt,
          maxResults: this.PAGE_SIZE,
        },
        projectId
      );

      executionLog.collect(jobId, {
        entity_type: EExecutionLogEntityType.BOARDS,
        phase: "PULL_BOARDS",
        level: EExecutionLogLevel.INFO,
        metrics: {
          pulled: result.items.length,
          total: result.total,
        },
        additional_data: {
          scrumBoards: result.items.filter((board) => board.type === "scrum").length,
        },
      });

      logger.info(`[${jobId}] [${this.name}] Pulled boards`, {
        jobId,
        count: result.items.length,
        hasMore: result.hasMore,
      });

      return result;
    } catch (error) {
      logger.error(`[${jobId}][${this.name}] Unable to pull boards from Jira`, error);

      executionLog.collect(jobId, {
        entity_type: EExecutionLogEntityType.BOARDS,
        phase: "PULL_BOARDS",
        level: EExecutionLogLevel.ERROR,
        error: extractErrorMetadata(error),
        is_fatal: true,
      });

      throw error;
    }
  }

  /**
   * Checks if step should return empty context (no boards found on first page)
   */
  private shouldReturnEmpty(result: PaginatedResult<Board>, startAt: number): boolean {
    return result.items.length === 0 && startAt === 0;
  }

  /**
   * Stores boards in Redis with automatic deduplication by board ID
   */
  private async storeBoards(storage: IStorageService, jobId: string, items: Board[]) {
    if (items.length === 0) return;

    try {
      const boardData: TBoardData = items
        .filter((board) => board.id && board.name && board.type)
        .map((board) => ({
          id: board.id,
          name: board.name,
          type: board.type,
        })) as TBoardData;

      await storage.storeData(jobId, this.name, boardData, ["id"]);

      executionLog.collect(jobId, {
        entity_type: EExecutionLogEntityType.BOARDS,
        phase: "STORE_BOARDS",
        ignore_summarization: true,
        level: EExecutionLogLevel.SUCCESS,
        additional_data: {
          storedBoards: boardData.length,
          boardNames: boardData.map((b) => b.name),
        },
      });

      logger.info(`[${jobId}] [${this.name}] Stored boards`, { count: boardData.length });
    } catch (error) {
      logger.error(`[${jobId}][${this.name}] Unable to store boards`, error);

      executionLog.collect(jobId, {
        entity_type: EExecutionLogEntityType.BOARDS,
        phase: "STORE_BOARDS",
        level: EExecutionLogLevel.ERROR,
        error: extractErrorMetadata(error),
        is_fatal: true,
        additional_data: {
          attemptedCount: items.length,
        },
      });

      throw error;
    }
  }

  /**
   * Builds the next context based on pagination state
   */
  private buildNextContext(
    result: PaginatedResult<Board>,
    startAt: number,
    totalProcessed: number
  ): TStepExecutionContext {
    const pulled = result.items.length;

    if (result.hasMore) {
      return createContinueContext({
        nextStartAt: startAt + result.items.length,
        totalProcessed,
        pulled,
        pushed: pulled,
      });
    }

    return createSuccessContext({
      pulled,
      pushed: pulled,
      totalProcessed,
    });
  }
}
