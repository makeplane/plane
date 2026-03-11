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
import type { IStep, TStepExecutionContext, TStepExecutionInput } from "@/apps/jira-server-importer/v2/types";
import { EJiraStep } from "@/apps/jira-server-importer/v2/types";
import type { JiraConfig } from "@plane/etl/jira-server";
import type { ExProject } from "@plane/sdk";
import { integrationConnectionHelper } from "@/helpers/integration-connection-helper";

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
    const { job, planeClient } = jobContext;
    const { workspace_slug } = job;

    if (!this.shouldExecute(input)) {
      return createEmptyContext();
    }

    const jobConfig = job.config as JiraConfig;
    const project = jobConfig.project;

    logger.info(`[${job.id}][${this.name}] Creating project ${project.name}`);

    try {
      const randomSuffix = this.createRandomProjectKey().substring(0, 4);
      const projectName = project.name ?? "Untitled Project";
      const projectIdentifier = `${(project.key ?? "PRJ").substring(0, 3)}${randomSuffix.substring(0, 2)}`;

      const projectPayload: Partial<ExProject> = {
        name: `${projectName} ${randomSuffix}`,
        description: project.description ?? "",
        identifier: projectIdentifier,
      };

      const createdProject = await planeClient.project.create(workspace_slug, projectPayload);

      await integrationConnectionHelper.updateImportJob({
        job_id: job.id,
        project_id: createdProject.id,
        config: {
          ...job.config,
          planeProject: createdProject,
        },
      });

      return createEmptyContext();
    } catch (error) {
      logger.error(`[${job.id}][${this.name}] Failed to configure project`, error);
      throw error;
    }
  }
}
