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

import { logger } from "@plane/logger";
import type { ExIssue, ExModule, Client as PlaneClient } from "@plane/sdk";
import { getJobData } from "@/helpers/job";
import { processBatchPromises } from "@/helpers/methods";
import { AssertAPIErrorResponse, protect } from "@/lib";
import { executionLog } from "@/lib/execution-log/service/execution-log.service";
import { EExecutionLogLevel, EExecutionLogEntityType } from "@/lib/execution-log/types";
import { extractErrorMetadata } from "@/helpers/errors";

export const createModules = async (
  jobId: string,
  modules: ExModule[],
  allIssues: ExIssue[],
  planeClient: PlaneClient,
  workspaceSlug: string,
  projectId: string
): Promise<void> => {
  const job = await getJobData(jobId);

  for (const module of modules) {
    // Create the cycle and get the cycle id
    let moduleId = "";
    /* TODO: User may have changed the module name, in that case taking this
     * name won't be appropriate */
    const moduleName = module.name;
    try {
      const createdModule = await protect(
        planeClient.modules.create.bind(planeClient.modules),
        workspaceSlug,
        projectId,
        module
      );
      moduleId = createdModule.id;
    } catch (error) {
      if (AssertAPIErrorResponse(error)) {
        if (error.error && error.error.includes("already exists")) {
          logger.info(`[${jobId.slice(0, 7)}] Module "${module.name}" already exists. Skipping...`);
          // Get the id from the module
          moduleId = error.id;
        }
      } else {
        logger.error(`[${jobId.slice(0, 7)}] Error while creating the module: ${module.name}`, error);
      }
    }

    if (module.issues.length > 0 && moduleId != "") {
      const moduleIssueIds = await Promise.all(
        module.issues
          .map(async (issue) => {
            const planeIssue = allIssues.find((planeIssue) => planeIssue.external_id === issue);
            if (planeIssue) {
              return planeIssue.id;
            } else {
              try {
                const fetchedIssue: any = await protect(
                  planeClient.issue.getIssueWithExternalId.bind(planeClient.issue),
                  workspaceSlug,
                  projectId,
                  issue,
                  job.source
                );
                return fetchedIssue?.id;
              } catch (e) {
                logger.error("Error while fetching issue for module", e);
              }
              // fetch the issue from plane if the issue is not found in the allIssues
            }
          })
          .filter((issue) => issue !== undefined)
      );
      // If there is any match for the issue ids then add the issues to the module
      if (moduleIssueIds.length > 0) {
        try {
          await protect(
            planeClient.modules.addIssues.bind(planeClient.modules),
            workspaceSlug,
            projectId,
            moduleId,
            moduleName,
            moduleIssueIds as string[]
          );
        } catch (error) {
          logger.error(`[${jobId.slice(0, 7)}] Error while adding issues to the module: ${module.name}`, error);
        }
      }
    }
  }
};

export const createAllModules = async (
  jobId: string,
  modules: ExModule[],
  planeClient: PlaneClient,
  workspaceSlug: string,
  projectId: string
): Promise<{ id: string; issues: string[] }[]> => {
  const createOrUpdateModule = async (module: ExModule): Promise<{ id: string; issues: string[] } | undefined> => {
    try {
      const createdModule = await protect(
        planeClient.modules.create.bind(planeClient.modules),
        workspaceSlug,
        projectId,
        module
      );
      return { id: createdModule.id, issues: module.issues };
    } catch (error) {
      logger.warn(`Warning while creating the module: ${module.name}`, {
        jobId: jobId,
      });
      if (AssertAPIErrorResponse(error)) {
        if (error.error && error.error.includes("already exists")) {
          logger.info(`[${jobId.slice(0, 7)}] Module "${module.name}" already exists. Skipping...`);
          // Get the id from the module
          return { id: error.id, issues: module.issues };
        } else {
          logger.error(`Error while creating the module: ${module.name}`, {
            jobId: jobId,
            error: error,
          });
        }
      }
      return undefined;
    }
  };

  const createdModules = await processBatchPromises(modules, createOrUpdateModule, 2);

  return createdModules.filter((module) => module !== undefined) as { id: string; issues: string[] }[];
};

export const createAllModulesV2 = async (
  jobId: string,
  modules: ExModule[],
  planeClient: PlaneClient,
  workspaceSlug: string,
  projectId: string
): Promise<{ external_id: string; id: string }[]> => {
  const createOrUpdateModule = async (module: ExModule): Promise<{ external_id: string; id: string } | undefined> => {
    try {
      const createdModule = await protect(
        planeClient.modules.create.bind(planeClient.modules),
        workspaceSlug,
        projectId,
        module
      );

      executionLog.collect(jobId, {
        entity_type: EExecutionLogEntityType.MODULE,
        phase: "CREATE_MODULE",
        level: EExecutionLogLevel.SUCCESS,
        entity_external_id: module.external_id,
        entity_plane_id: createdModule.id,
        entity_name: module.name,
      });

      return { external_id: module.external_id, id: createdModule.id };
    } catch (error) {
      logger.warn(`Warning while creating the module: ${module.name}`, {
        jobId: jobId,
      });
      if (AssertAPIErrorResponse(error)) {
        if (error.error && error.error.includes("already exists")) {
          logger.info(`[${jobId.slice(0, 7)}] Module "${module.name}" already exists. Skipping...`);

          executionLog.collect(jobId, {
            entity_type: EExecutionLogEntityType.MODULE,
            phase: "CREATE_MODULE",
            level: EExecutionLogLevel.SUCCESS,
            entity_external_id: module.external_id,
            entity_plane_id: error.id,
            already_existed: true,
          });

          return { external_id: module.external_id, id: error.id };
          // Get the id from the module
        } else {
          logger.error(`Error while creating the module: ${module.name}`, {
            jobId: jobId,
            error: error,
          });

          executionLog.collect(jobId, {
            entity_type: EExecutionLogEntityType.MODULE,
            phase: "CREATE_MODULE",
            level: EExecutionLogLevel.ERROR,
            error: extractErrorMetadata(error),
            entity_name: module.name,
            entity_external_id: module.external_id,
          });
        }
      } else {
        executionLog.collect(jobId, {
          entity_type: EExecutionLogEntityType.MODULE,
          phase: "CREATE_MODULE",
          level: EExecutionLogLevel.ERROR,
          error: extractErrorMetadata(error),
          entity_name: module.name,
          entity_external_id: module.external_id,
        });
      }
      return undefined;
    }
  };

  const createdModules = await processBatchPromises(modules, createOrUpdateModule, 2);

  return createdModules.filter((module) => module !== undefined) as { external_id: string; id: string }[];
};
