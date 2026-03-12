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

/**
 * @overview
 * This step takes the responsibility of creating a new project in case, the import is not
 * executed with an already existing project
 */
import { logger } from "@plane/logger";
import { createEmptyContext } from "@/apps/jira-server-importer/v2/helpers/ctx";
import type {
  IStep,
  TJobContext,
  TStepExecutionContext,
  TStepExecutionInput,
} from "@/apps/jira-server-importer/v2/types";
import { EJiraStep } from "@/apps/jira-server-importer/v2/types";
import type { JiraConfig } from "@plane/etl/jira-server";
import type { ExProject } from "@plane/sdk";
import { integrationConnectionHelper } from "@/helpers/integration-connection-helper";

const PROJECT_ALREADY_EXIST_ERRORS = ["The project name is already taken", "The project identifier is already taken"];

export class PlaneProjectCreateStep implements IStep {
  name = EJiraStep.PLANE_PROJECT_CREATION;
  dependencies: EJiraStep[] = [];

  /**
   * Without the project, there will be no destination for import, hence
   * if project step fails, it's better to fail the entire import
   */
  stepRequired?: boolean | undefined = true;

  shouldExecute(input: TStepExecutionInput): boolean {
    const { jobContext } = input;
    const { job } = jobContext;
    const { project_id } = job;
    return !project_id;
  }

  createRandomProjectKey(): string {
    const randomString = Math.random().toString(36).substring(2, 8).toUpperCase();
    return randomString;
  }

  async execute(input: TStepExecutionInput): Promise<TStepExecutionContext> {
    const { jobContext } = input;
    const { job } = jobContext;

    if (!this.shouldExecute(input)) {
      return createEmptyContext();
    }

    const jobConfig = job.config as JiraConfig;
    const project = jobConfig.project;

    logger.info(`[${job.id}][${this.name}] Creating project ${project.name}`);

    try {
      try {
        await this.createProjectAndUpdateJob(jobContext, {
          name: project.name ?? "Untitled Project",
          description: project.description ?? "",
          identifier: project.key ?? "PRJ",
        });
      } catch (error: unknown) {
        if (this.isProjectAlreadyExistError(error)) {
          const randomSuffix = this.createRandomProjectKey().substring(0, 4);
          const projectName = `${project.name ?? "Untitled Project"} ${randomSuffix}`;
          const projectIdentifier = `${(project.key ?? "PRJ").substring(0, 3)}${randomSuffix.substring(0, 2)}`;

          await this.createProjectAndUpdateJob(jobContext, {
            name: projectName,
            description: project.description ?? "",
            identifier: projectIdentifier,
          });
        } else {
          throw error;
        }
      }

      return createEmptyContext();
    } catch (error) {
      logger.error(`[${job.id}][${this.name}] Failed to configure project`, error);
      throw error;
    }
  }

  /**
   * Creates a new project in Plane
   * @param jobContext
   * @param projectPayload
   */
  async createProjectAndUpdateJob(jobContext: TJobContext, projectPayload: Partial<ExProject>) {
    const { job, planeClient } = jobContext;
    const { workspace_slug } = job;
    const createdProject = await planeClient.project.create(workspace_slug, projectPayload);
    await integrationConnectionHelper.updateImportJob({
      job_id: job.id,
      project_id: createdProject.id,
      config: {
        ...job.config,
        planeProject: createdProject,
      },
    });

    return createdProject;
  }

  /**
   * Checks if the error is related to the project already existing
   * @param error unknown error
   */
  private isProjectAlreadyExistError(error: unknown): boolean {
    if (typeof error === "object" && error !== null) {
      for (const field of ["name", "identifier"] as const) {
        if (!(field in error)) continue;
        const fieldError = (error as Record<string, unknown>)[field];
        if (typeof fieldError === "string") {
          if (PROJECT_ALREADY_EXIST_ERRORS.includes(fieldError)) return true;
        } else if (Array.isArray(fieldError)) {
          if (PROJECT_ALREADY_EXIST_ERRORS.some((e) => fieldError.includes(e))) return true;
        }
      }
    }
    return false;
  }
}
