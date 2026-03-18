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
import { createEmptyContext, createSuccessContext } from "@/apps/jira-server-importer/v2/helpers/ctx";
import { EJiraStep } from "@/apps/jira-server-importer/v2/types";
import type {
  IStep,
  TJobContext,
  TStepExecutionContext,
  TStepExecutionInput,
} from "@/apps/jira-server-importer/v2/types";
import { integrationConnectionHelper } from "@/helpers/integration-connection-helper";
import { STATE_GROUPS } from "@plane/constants";
import type { IStateConfig, JiraConfig } from "@plane/etl/jira-server";
import { buildExtenalId } from "@plane/etl/jira-server";
import type { ExState } from "@plane/sdk";
import type { TImportJob, TStateGroups } from "@plane/types";
import type { StatusCategory, StatusDetails } from "jira.js/out/version2/models";

/**
 * @overview
 * This step is responsible for pulling states from Jira, transforming them into Plane states,
 * and creating them in the Plane workspace.
 */
export class JiraStatesStep implements IStep {
  name = EJiraStep.STATES;
  dependencies: EJiraStep[] = [];

  /**
   * Determines if the state migration step should be executed.
   * Execution is skipped if the job configuration already contains state mappings.
   * @param input - Step execution input containing job context and storage.
   * @returns Boolean indicating whether to execute the step.
   */
  shouldExecute(input: TStepExecutionInput): boolean {
    const { jobContext } = input;
    const job = jobContext.job as TImportJob<JiraConfig>;
    return !job.config.state || job.config.state.length === 0;
  }

  /**
   * Orchestrates the state migration process:
   * 1. Pulls states (sourceClient) and prepares them for creation.
   * 2. Creates the transformed states in Plane (planeClient).
   * 3. Updates the import job configuration with the new state mappings.
   * @param input - Step execution input containing job context and storage.
   * @returns A promise that resolves to an empty execution context upon success.
   */
  async execute(input: TStepExecutionInput): Promise<TStepExecutionContext> {
    if (!this.shouldExecute(input)) return createEmptyContext();

    const { jobContext } = input;
    const { job } = jobContext;

    const jobConfig = job.config as JiraConfig;

    const stateMap = await this.processStates(jobContext);

    await integrationConnectionHelper.updateImportJob({
      job_id: job.id,
      config: {
        ...jobConfig,
        state: stateMap,
      },
    });

    return createSuccessContext({
      pulled: stateMap.length,
      totalProcessed: stateMap.length,
      pushed: stateMap.length,
    });
  }

  /**
   * Fetches statuses from the Jira project and transforms them into a format ready for Plane creation.
   * This method is intended to be overridable for different Jira providers (e.g., Jira Cloud).
   * @param jobContext - The current job context containing clients and job configuration.
   * @returns A promise resolving to an array of objects containing the original Jira status and its transformed Plane equivalent.
   */
  protected async processStates(jobContext: TJobContext): Promise<IStateConfig[]> {
    const { job, planeClient } = jobContext;
    const jobConfig = job.config as JiraConfig;
    const jiraResourceId = jobConfig.resource?.id;
    const jiraProjectId = jobConfig.project.id;

    if (!jiraProjectId) {
      throw new Error(`[${job.id}] Assertion Failed Jira project ID is required`);
    }

    const jiraStates = await this.pull(jobContext);
    const alreadyExistingPlaneStates = await this.getProjectStates(jobContext);

    const stateMap: IStateConfig[] = [];

    const nonExistentJiraStates = jiraStates.filter((jiraState) => {
      const [existingPlaneState] = alreadyExistingPlaneStates.filter((planeState) => {
        const planeStateName = this.removeWhiteSpaces(planeState.name.toLowerCase());
        const jiraStateName = this.removeWhiteSpaces(jiraState.name?.toLowerCase() ?? "");
        return planeStateName === jiraStateName;
      });

      if (!existingPlaneState) return true;

      stateMap.push({
        source_state: jiraState,
        target_state: existingPlaneState,
      });

      return false;
    });

    const statesPromise = nonExistentJiraStates.map(async (jiraState) => {
      const planeState = this.transformState(jiraResourceId ?? "", jiraProjectId, jiraState);
      const createdState = await planeClient.state.create(job.workspace_slug, job.project_id, planeState);

      return {
        source_state: jiraState,
        target_state: createdState,
      };
    });

    const statesToCreate = await Promise.all(statesPromise);

    return [...stateMap, ...statesToCreate];
  }

  /**
   * Fetches statuses from the Jira project.
   * This is an overridable method for different Jira versions (Server vs Cloud).
   * @param jobContext - The current job context.
   * @returns A promise resolving to an array of Jira StatusDetails.
   */
  protected async pull(jobContext: TJobContext) {
    const { job, sourceClient } = jobContext;
    const jobConfig = job.config as JiraConfig;
    const jiraProjectId = jobConfig.project.id;

    if (!jiraProjectId) {
      throw new Error(`[${job.id}] Assertion Failed Jira project ID is required`);
    }

    return await sourceClient.getProjectStatuses(jiraProjectId);
  }

  /**
   * Maps a Jira status category to a Plane state group and color.
   * @param statusCategory - The Jira status category.
   * @returns An object containing the Plane state group key and color.
   */
  protected resolveStateGroup(statusCategory: StatusCategory | undefined): { group: TStateGroups; color: string } {
    const defaultStateGroup = { group: STATE_GROUPS.backlog.key, color: STATE_GROUPS.backlog.color };

    if (!statusCategory) return defaultStateGroup;

    switch (statusCategory.key) {
      case "new":
        return { group: STATE_GROUPS.unstarted.key, color: STATE_GROUPS.unstarted.color };
      case "indeterminate":
        return { group: STATE_GROUPS.started.key, color: STATE_GROUPS.started.color };
      case "done":
        return { group: STATE_GROUPS.completed.key, color: STATE_GROUPS.completed.color };
      default:
        return defaultStateGroup;
    }
  }

  /**
   * Fetches all states from the Plane project.
   * @param jobContext - The current job context containing clients and job configuration.
   * @returns A promise resolving to an array of Plane states.
   */
  protected async getProjectStates(jobContext: TJobContext): Promise<ExState[]> {
    const { job, planeClient } = jobContext;
    const allStates = await planeClient.state.list(job.workspace_slug, job.project_id);
    return allStates.results;
  }

  /**
   * Transforms a Jira status into a Partial Plane state object.
   * Maps Jira status categories to Plane state groups and sets external IDs.
   * @param resourceId - The Jira resource ID.
   * @param projectId - The Jira project ID.
   * @param jiraStatus - The Jira status details.
   * @returns A partial Plane state object.
   */
  transformState(resourceId: string, projectId: string, jiraStatus: StatusDetails): Partial<ExState> {
    const statusCategory = jiraStatus.statusCategory;
    const { group, color } = this.resolveStateGroup(statusCategory);

    return {
      external_id: buildExtenalId([projectId, resourceId, jiraStatus.id]),
      name: jiraStatus.name,
      group,
      color,
    };
  }

  /**
   * Helper method to remove all whitespace from a string for normalization.
   * @param v - The string to process.
   * @returns The string without whitespace.
   */
  removeWhiteSpaces(v: string): string {
    return v.replace(/\s/g, "");
  }
}
