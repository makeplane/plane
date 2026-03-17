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

import { E_IMPORTER_KEYS, E_JOB_STATUS } from "@plane/etl/core";
import type { JiraConfig } from "@plane/etl/jira-server";
import { logger } from "@plane/logger";
import type { TImportJob } from "@plane/types";
import { createJiraClient } from "@/apps/jira-server-importer/helpers/migration-helpers";
import { flushJob, withCache } from "@/apps/jira-server-importer/v2/helpers/cache";
import type {
  IStep,
  IStorageService,
  TJobContext,
  TOrchestratorState,
  TStepExecutionContext,
  TStepExecutionInput,
} from "@/apps/jira-server-importer/v2/types";
import { getJobCredentials, getJobData } from "@/helpers/job";
import { getPlaneAPIClient, getPlaneFeatureFlagService } from "@/helpers/plane-api-client";
import { getAPIClientInternal } from "@/services/client";
import type { TaskHandler, TaskHeaders } from "@/types";
import type { MQ, Store } from "@/worker/base";
import { redisStorageService } from "../services/storage.service";
import { ImportTimeoutError } from "../helpers/errors";
import { executionLog } from "@/lib/execution-log/service/execution-log.service";
import { E_FEATURE_FLAGS } from "@plane/constants";

/**
 * Task types for orchestrator
 */
export enum EOrchestratorTaskType {
  INITIATE = "initiate",
  EXECUTE_STEP = "execute_step",
  COMPLETE = "complete",
}

/**
 * Task data structure
 */
type OrchestratorTaskData = {
  state?: TOrchestratorState;
  stepContext?: TStepExecutionContext;
};

const client = getAPIClientInternal();

export class JiraImportOrchestrator implements TaskHandler {
  private storage: IStorageService = redisStorageService;

  constructor(
    private readonly mq: MQ,
    private readonly store: Store,
    private readonly steps: IStep[]
  ) {}

  /**
   * Main task handler - called by worker
   */
  async handleTask(headers: TaskHeaders, data: OrchestratorTaskData): Promise<boolean> {
    try {
      const jobId = headers.jobId;

      // Check if job is cancelled
      if (await this.isJobCancelled(jobId)) {
        await flushJob(jobId);
        logger.info(`Job cancelled, aborting`, { jobId });
        return true;
      }

      switch (headers.type as EOrchestratorTaskType) {
        case EOrchestratorTaskType.INITIATE:
          await this.handleInitiate(headers);
          break;

        case EOrchestratorTaskType.EXECUTE_STEP:
          await this.handleExecuteStep(headers, data);
          break;

        case EOrchestratorTaskType.COMPLETE:
          await this.handleComplete(headers);
          break;

        default:
          logger.warn(`Unknown task type: ${headers.type}`, { jobId });
      }

      return true;
    } catch (error) {
      logger.error(`Orchestrator task failed`, {
        jobId: headers.jobId,
        type: headers.type,
        error: error,
      });

      // Mark job as failed
      await this.failJob(headers.jobId, error as Error);
      return true;
    }
  }

  /**
   * Handle initiate: Start the job
   */
  private async handleInitiate(headers: TaskHeaders): Promise<void> {
    const jobId = headers.jobId;
    logger.info(`[ORCHESTRATOR] Initiating job`, { jobId });

    // Initialize state
    const state: TOrchestratorState = {
      jobId,
      currentStepIndex: 0,
      currentStepName: this.steps[0].name,
      totalSteps: this.steps.length,
      completedSteps: [],
      startedAt: new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString(),
    };

    await this.saveState(state);

    // Update job status
    await this.updateJobStatus(jobId, E_JOB_STATUS.PULLING);

    // Push first step to queue
    await this.mq.sendMessage(
      { state },
      {
        headers: {
          ...headers,
          type: EOrchestratorTaskType.EXECUTE_STEP,
        },
      }
    );

    logger.info(`[ORCHESTRATOR] First step queued`, {
      jobId,
      step: state.currentStepName,
    });
  }

  /**
   * Handle execute_step: Execute ONE iteration of current step
   */
  private async handleExecuteStep(headers: TaskHeaders, data: OrchestratorTaskData): Promise<void> {
    const jobId = headers.jobId;

    // Load execution context
    const { state, step, jobContext } = await this.loadStepExecution(jobId, data);

    try {
      // Execute step and handle result
      await this.executeAndHandleResult(headers, state, step, jobContext);
    } catch (error) {
      // Log error and move to next step instead of failing the job
      await this.handleStepError(headers, state, step, error);
    }
  }

  /**
   * Handle step error: Log error and move to next step
   */
  private async handleStepError(
    headers: TaskHeaders,
    state: TOrchestratorState,
    step: IStep,
    error: unknown
  ): Promise<void> {
    const errorMessage =
      error instanceof Error ? error.message : typeof error === "object" ? JSON.stringify(error) : String(error);

    logger.error(`[ORCHESTRATOR] Step failed, continuing to next step`, {
      jobId: state.jobId,
      step: step.name,
      stepIndex: state.currentStepIndex + 1,
      totalSteps: state.totalSteps,
      error: errorMessage,
    });

    // Track failed step
    if (!state.failedSteps) {
      state.failedSteps = [];
    }
    state.failedSteps.push({
      name: step.name,
      error: errorMessage,
      failedAt: new Date().toISOString(),
    });

    // Push execution logs after step error
    await this.pushExecutionLog(state.jobId);

    // Move to next step
    state.currentStepIndex++;
    state.stepContext = undefined;
    await this.saveState(state);

    if (step.stepRequired) {
      return await this.failJob(state.jobId, error as Error);
    }

    if (state.currentStepIndex >= this.steps.length) {
      // All steps processed (some may have failed)
      await this.mq.sendMessage(
        {},
        {
          headers: {
            ...headers,
            type: EOrchestratorTaskType.COMPLETE,
          },
        }
      );
    } else {
      // Move to next step
      state.currentStepName = this.steps[state.currentStepIndex].name;
      await this.saveState(state);
      await this.mq.sendMessage(
        { state },
        {
          headers: {
            ...headers,
            type: EOrchestratorTaskType.EXECUTE_STEP,
          },
        }
      );
    }
  }

  /**
   * Load everything needed for step execution
   */
  private async loadStepExecution(
    jobId: string,
    data: OrchestratorTaskData
  ): Promise<{ state: TOrchestratorState; step: IStep; jobContext: TJobContext }> {
    // Load or use provided state
    const state = data.state || (await this.loadState(jobId));
    if (!state) {
      throw new Error(`State not found for job ${jobId}`);
    }

    const step = this.steps[state.currentStepIndex];
    if (!step) {
      throw new Error(`Step not found at index ${state.currentStepIndex}`);
    }

    logger.info(`[ORCHESTRATOR] Executing step`, {
      jobId,
      step: step.name,
      stepIndex: state.currentStepIndex + 1,
      totalSteps: state.totalSteps,
      progress: `${state.completedSteps.length}/${state.totalSteps}`,
    });

    const jobContext = await this.initializeJobContext(jobId);

    return { state, step, jobContext };
  }

  /**
   * Initialize job context
   */
  private async initializeJobContext(jobId: string): Promise<TJobContext> {
    const job = await getJobData(jobId);
    const credentials = await getJobCredentials(job as TImportJob<JiraConfig>);
    const planeClient = await getPlaneAPIClient(credentials, E_IMPORTER_KEYS.IMPORTER);
    const sourceClient = createJiraClient(job as TImportJob<JiraConfig>, credentials);

    return { job, credentials, planeClient, sourceClient };
  }

  /**
   * Execute step and handle the result
   */
  private async executeAndHandleResult(
    headers: TaskHeaders,
    state: TOrchestratorState,
    step: IStep,
    jobContext: TJobContext
  ): Promise<void> {
    // Execute ONE iteration
    const context = await this.executeStep(step, jobContext, state);

    // Push execution logs after each step execution, regardless of outcome
    await this.pushExecutionLog(state.jobId);

    // Check if step has more pages
    if (context.pageCtx.hasMore) {
      // More data to process - retrigger same step
      state.stepContext = context;
      await this.saveState(state);

      logger.info(`[ORCHESTRATOR] Step has more data, retriggering`, {
        jobId: state.jobId,
        step: step.name,
        totalProcessed: context.pageCtx.totalProcessed,
      });

      await this.mq.sendMessage(
        { state },
        {
          headers: {
            ...headers,
            type: EOrchestratorTaskType.EXECUTE_STEP,
          },
        }
      );
    } else {
      // Step complete - move to next step or complete job
      state.completedSteps.push(step.name);
      state.currentStepIndex++;
      state.stepContext = undefined;
      await this.saveState(state);

      logger.info(`[ORCHESTRATOR] Step completed`, {
        jobId: state.jobId,
        step: step.name,
        totalProcessed: context.pageCtx.totalProcessed,
        progress: `${state.completedSteps.length}/${state.totalSteps}`,
      });

      if (state.currentStepIndex >= this.steps.length) {
        // All steps complete
        await this.mq.sendMessage(
          {},
          {
            headers: {
              ...headers,
              type: EOrchestratorTaskType.COMPLETE,
            },
          }
        );
      } else {
        // Move to next step
        state.currentStepName = this.steps[state.currentStepIndex].name;
        await this.saveState(state);
        await this.mq.sendMessage(
          { state },
          {
            headers: {
              ...headers,
              type: EOrchestratorTaskType.EXECUTE_STEP,
            },
          }
        );
      }
    }
  }

  /**
   * Captures job state snapshot including orchestrator state and flushed cache/data
   */
  private async captureJobStateSnapshot(jobId: string) {
    // Get orchestrator state before deletion
    const stateKey = `orchestrator:state:${jobId}`;
    const orchestratorState = await this.store.get(stateKey);

    // Flush cache and get deleted data
    const flushedState = await flushJob(jobId);
    const timestamp = new Date().toISOString();

    const stateSnapshot = {
      orchestratorState: orchestratorState ? JSON.parse(orchestratorState) : null,
      cache: Object.fromEntries(flushedState.cache),
      data: Object.fromEntries(flushedState.data),
    };

    return { stateSnapshot, timestamp, stateKey };
  }

  /**
   * Handle complete: Finish the job
   */
  private async handleComplete(headers: TaskHeaders): Promise<void> {
    const jobId = headers.jobId;
    logger.info(`[ORCHESTRATOR] Completing job`, { jobId });

    // Ensure final logs are pushed before completing
    await this.pushExecutionLog(jobId);

    const { stateSnapshot, timestamp, stateKey } = await this.captureJobStateSnapshot(jobId);

    // Append to existing success_metadata
    const updatedMetadata = {
      [timestamp]: stateSnapshot,
    };

    await client.importJob.updateImportJob(jobId, {
      success_metadata: updatedMetadata,
      status: "FINISHED",
    });

    // Delete orchestrator state
    await this.store.del(stateKey);

    logger.info(`[ORCHESTRATOR] Job completed`, { jobId });
  }

  /**
   * Execute single step iteration
   */
  private async executeStep(
    step: IStep,
    jobContext: TJobContext,
    state: TOrchestratorState
  ): Promise<TStepExecutionContext> {
    // Load dependencies in parallel
    const dependencyData = await this.loadDependencies(jobContext.job.id, step);

    // Execute
    const input: TStepExecutionInput = {
      jobContext,
      storage: this.storage,
      previousContext: state.stepContext,
      dependencyData,
    };

    return await step.execute(input);
  }

  /**
   * Load dependency data for a step (in parallel)
   */
  private async loadDependencies(jobId: string, step: IStep): Promise<Record<string, any>> {
    if (step.dependencies.length === 0) {
      return {};
    }

    logger.info(`[ORCHESTRATOR] Loading dependencies in parallel`, {
      jobId,
      step: step.name,
      dependencies: step.dependencies,
    });

    // Load all dependencies in parallel
    const dependencyPromises = step.dependencies.map(async (depStepName) => {
      const data = await this.storage.retrieveData(jobId, depStepName);
      return { depStepName, data };
    });

    const results = await Promise.all(dependencyPromises);

    // Build dependency data object
    const dependencyData: Record<string, any> = {};
    results.forEach(({ depStepName, data }) => {
      if (data) {
        dependencyData[depStepName] = data;
      } else {
        logger.warn(`[ORCHESTRATOR] Dependency data not found`, {
          jobId,
          step: step.name,
          missingDependency: depStepName,
        });
      }
    });

    return dependencyData;
  }

  /**
   * Check if job is cancelled
   */
  private async isJobCancelled(jobId: string): Promise<boolean> {
    const job = await getJobData(jobId);
    return !!job.cancelled_at;
  }

  /**
   * Load state from Redis
   */
  private async loadState(jobId: string): Promise<TOrchestratorState | null> {
    const stateKey = `orchestrator:state:${jobId}`;
    const stateJson = await this.store.get(stateKey);
    return stateJson ? JSON.parse(stateJson) : null;
  }

  /**
   * Save state to Redis
   */
  private async saveState(state: TOrchestratorState): Promise<void> {
    const stateKey = `orchestrator:state:${state.jobId}`;
    const TTL = 7 * 24 * 60 * 60; // 7 days

    state.lastUpdatedAt = new Date().toISOString();
    await this.store.set(stateKey, JSON.stringify(state), TTL, false);
  }

  /**
   * Update job status
   */
  private async updateJobStatus(jobId: string, status: string): Promise<void> {
    await client.importJob.updateImportJob(jobId, { status: status as any });
  }

  /**
   * Mark job as failed
   */
  private async failJob(jobId: string, error: any): Promise<void> {
    // Push logs before marking job as failed
    try {
      await this.pushExecutionLog(jobId);
    } catch (logError) {
      // If getting job context fails, don't block the failJob process
      logger.error(`Failed to push execution logs for failed job`, { jobId, error: logError });
    }

    const { stateSnapshot, timestamp, stateKey } = await this.captureJobStateSnapshot(jobId);

    const updatedErrorMetadata = {
      error: error instanceof Error ? error.message : typeof error === "object" ? JSON.stringify(error) : String(error),
      stateSnapshots: {
        [timestamp]: stateSnapshot,
      },
    };

    let status = E_JOB_STATUS.ERROR;

    if (error instanceof ImportTimeoutError) {
      status = E_JOB_STATUS.TIMED_OUT;
    }

    await client.importJob.updateImportJob(jobId, {
      status,
      error_metadata: updatedErrorMetadata,
    });

    // Delete orchestrator state
    await this.store.del(stateKey);
  }

  private async pushExecutionLog(jobId: string): Promise<void> {
    const jobContext = await this.initializeJobContext(jobId);
    const featureFlagService = await getPlaneFeatureFlagService();

    const isImportSummaryEnabled = await withCache(
      "IMPORT_SUMMARY_ENABLED",
      jobContext.job,
      async () =>
        await featureFlagService.featureFlags({
          workspace_slug: jobContext.job.workspace_slug,
          user_id: jobContext.job.initiator_id,
          flag_key: E_FEATURE_FLAGS.IMPORT_SUMMARY,
        })
    );

    logger.info(`[${jobId}][ORCHESTRATOR] Import summary enabled`, { isImportSummaryEnabled });

    if (!isImportSummaryEnabled) {
      return;
    }

    await executionLog.push(jobId, jobContext.job.report_id);
  }
}
