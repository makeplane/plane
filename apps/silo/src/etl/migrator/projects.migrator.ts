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

import { AxiosError } from "axios";
import { E_FEATURE_FLAGS, RANDOM_EMOJI_CODES } from "@plane/constants";
import { logger } from "@plane/logger";
import type { ExProject, Client as PlaneClient } from "@plane/sdk";
import type { TImportJob } from "@plane/types";
import { processBatchPromises } from "@/helpers/methods";
import { getPlaneFeatureFlagService } from "@/helpers/plane-api-client";
import { protect } from "@/lib";

export const createProjects = async (
  jobId: string,
  projects: Partial<ExProject>[],
  planeClient: PlaneClient,
  workspaceSlug: string,
  existingProjects: ExProject[]
): Promise<ExProject[]> => {
  const createProject = async (project: Partial<ExProject>): Promise<ExProject | undefined> => {
    try {
      const existingProject = existingProjects.find((exProject) => exProject.external_id === project.external_id);
      if (existingProject) {
        return existingProject;
      }

      const randomEmojiCode = RANDOM_EMOJI_CODES[Math.floor(Math.random() * RANDOM_EMOJI_CODES.length)];
      project.logo_props = {
        in_use: "emoji",
        emoji: {
          value: randomEmojiCode,
        },
      };

      const createdProject = (await protect(
        planeClient.project.create.bind(planeClient.project),
        workspaceSlug,
        project
      )) as ExProject;

      return createdProject;
    } catch (error) {
      logger.error(`Error while creating the project: ${project.name}`, {
        jobId: jobId,
        error: error,
      });
      return undefined;
    }
  };

  const createdProjects = await processBatchPromises(projects, createProject, 2);

  return createdProjects.filter((project) => project !== undefined);
};

export const enableIssueTypeForProject = async (
  job: TImportJob,
  project: ExProject,
  planeClient: PlaneClient,
  workspaceSlug: string
): Promise<ExProject | undefined> => {
  try {
    if (project.is_issue_type_enabled) {
      logger.info(`[${job.id.slice(0, 7)}] Issue type is already enabled for project: ${project.id}`);
      return project;
    }

    const featureFlagService = await getPlaneFeatureFlagService();
    const isIssueTypeFeatureEnabled = await featureFlagService.featureFlags({
      workspace_slug: job.workspace_slug,
      user_id: job.initiator_id,
      flag_key: E_FEATURE_FLAGS.ISSUE_TYPES,
    });

    if (isIssueTypeFeatureEnabled) {
      return await protect(planeClient.project.update.bind(planeClient.project), workspaceSlug, project.id, {
        is_issue_type_enabled: true,
      });
    }
    return project;
  } catch (error) {
    if (error instanceof AxiosError && error.response?.status === 400) {
      logger.error(
        `[${job.id.slice(0, 7)}] Error while enabling issue type for project: ${project.id}`,
        error?.response?.status
      );
    }
    logger.error(`[${job.id.slice(0, 7)}] Error while enabling issue type for project: ${project.id}`);
    return undefined;
  }
};
