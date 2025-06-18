import { AxiosError } from "axios";
import { RANDOM_EMOJI_CODES } from "@plane/constants";
import { E_FEATURE_FLAGS } from "@plane/etl/core";
import { ExProject, Client as PlaneClient } from "@plane/sdk";
import { TImportJob } from "@plane/types";
import { processBatchPromises } from "@/helpers/methods";
import { getPlaneFeatureFlagService } from "@/helpers/plane-api-client";
import { protect } from "@/lib";
import { logger } from "@/logger";

export const createProjects = async (
  jobId: string,
  projects: Partial<ExProject>[],
  planeClient: PlaneClient,
  workspaceSlug: string,
  existingProjects: ExProject[]
) => {
  const createProject = async (project: Partial<ExProject>) => {
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

      const createdProject: ExProject = await protect(
        planeClient.project.create.bind(planeClient.project),
        workspaceSlug,
        project
      );

      return createdProject;
    } catch (error) {
      logger.error(`[${jobId.slice(0, 7)}] Error while creating the project: ${project.name}`);
      return undefined;
    }
  };

  const createdProjects = await processBatchPromises(projects, createProject, 5);

  return createdProjects?.filter((project) => project !== undefined) ?? [];
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
