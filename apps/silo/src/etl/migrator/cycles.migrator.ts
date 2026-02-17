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
import type { ExCycle, ExIssue, Client as PlaneClient } from "@plane/sdk";
import { getJobData } from "@/helpers/job";
import { AssertAPIErrorResponse, protect } from "@/lib";
import { executionLog } from "@/lib/execution-log/service/execution-log.service";
import { EExecutionLogLevel, EExecutionLogEntityType } from "@/lib/execution-log/types";
import { extractErrorMetadata } from "@/helpers/errors";

/* ------------------------------ Cycles Creation ---------------------------- */
export const createCycles = async (
  jobId: string,
  cycles: ExCycle[],
  allIssues: ExIssue[],
  planeClient: PlaneClient,
  workspaceSlug: string,
  projectId: string
): Promise<void> => {
  const job = await getJobData(jobId);

  for (const cycle of cycles) {
    // Create the cycle and get the cycle id
    let cycleId = "";
    try {
      const createdCycle: ExCycle = await protect(
        planeClient.cycles.create.bind(planeClient.cycles),
        workspaceSlug,
        projectId,
        cycle
      );
      cycleId = createdCycle.id;
    } catch (error) {
      if (AssertAPIErrorResponse(error)) {
        if (error.error && error.error.includes("already exists")) {
          logger.info(`[${jobId.slice(0, 7)}] Cycle "${cycle.name}" already exists. Skipping...`);
          cycleId = error.id;
        }
      } else {
        logger.error(`[${jobId.slice(0, 7)}] Error while creating the cycle: ${cycle.name}`, error);
      }
    }

    // Create the cycle issues
    if (cycle.issues.length > 0 && cycleId != "") {
      // Get all the plane issue ids for the corrensponding cycle issues external ids
      const cycleIssueIds = await Promise.all(
        cycle.issues
          .map(async (issue) => {
            const planeIssue = allIssues.find((planeIssue) => planeIssue.external_id === issue);
            if (planeIssue) {
              return planeIssue.id;
            } else {
              // fetch the issue from plane if the issue is not found in the allIssues
              try {
                const fetchedIssue: any = await protect(
                  planeClient.issue.getIssueWithExternalId.bind(planeClient.issue),
                  workspaceSlug,
                  projectId,
                  issue,
                  // Dynamically take the source from the config
                  job.source
                );
                return fetchedIssue?.id;
              } catch (error) {
                logger.error(`[${jobId.slice(0, 7)}] Error while fetching the issue for the cycle: ${issue}`, error);
                return undefined;
              }
            }
          })
          .filter((issue) => issue !== undefined)
      );

      if (cycleIssueIds.length > 0) {
        try {
          await protect(
            planeClient.cycles.addIssues.bind(planeClient.cycles),
            workspaceSlug,
            projectId,
            cycleId,
            cycleIssueIds.filter((issue: string | undefined) => issue !== undefined)
          );
        } catch (error) {
          logger.error(`[${jobId.slice(0, 7)}] Error while adding issues to the cycle: ${cycle.name}`, error);
        }
      }
    }
  }
};

export const createAllCycles = async (
  jobId: string,
  cycles: ExCycle[],
  planeClient: PlaneClient,
  workspaceSlug: string,
  projectId: string
): Promise<{ id: string; issues: string[] }[]> => {
  const createdCycles: { id: string; issues: string[] }[] = [];

  for (const cycle of cycles) {
    // Create the cycle and get the cycle id
    try {
      const createdCycle: ExCycle = await protect(
        planeClient.cycles.create.bind(planeClient.cycles),
        workspaceSlug,
        projectId,
        {
          project_id: projectId,
          ...cycle,
        }
      );
      createdCycles.push({ id: createdCycle.id, issues: cycle.issues });
    } catch (error) {
      if (AssertAPIErrorResponse(error)) {
        if (error.error && error.error.includes("already exists")) {
          logger.info(`[${jobId.slice(0, 7)}] Cycle "${cycle.name}" already exists. Skipping...`);
          createdCycles.push({ id: error.id, issues: cycle.issues });
        }
      } else {
        logger.error(`[${jobId.slice(0, 7)}] Error while creating the cycle: ${cycle.name}`, error);
      }
    }
  }

  return createdCycles;
};

export const createAllCyclesV2 = async (
  jobId: string,
  cycles: ExCycle[],
  planeClient: PlaneClient,
  workspaceSlug: string,
  projectId: string
): Promise<{ external_id: string; id: string }[] | undefined> => {
  const createdCycles: { external_id: string; id: string }[] = [];

  for (const cycle of cycles) {
    // Create the cycle and get the cycle id
    try {
      const createdCycle: ExCycle = await protect(
        planeClient.cycles.create.bind(planeClient.cycles),
        workspaceSlug,
        projectId,
        {
          project_id: projectId,
          ...cycle,
        }
      );
      createdCycles.push(createdCycle);

      executionLog.collect(jobId, {
        entity_type: EExecutionLogEntityType.CYCLE,
        phase: "CREATE_CYCLE",
        level: EExecutionLogLevel.SUCCESS,
        entity_external_id: cycle.external_id,
        entity_plane_id: createdCycle.id,
        entity_name: cycle.name,
      });
    } catch (error) {
      if (AssertAPIErrorResponse(error)) {
        if (error.error && error.error.includes("already exists")) {
          logger.info(`[${jobId.slice(0, 7)}] Cycle "${cycle.name}" already exists. Skipping...`);
          createdCycles.push({ external_id: cycle.external_id, id: error.id });

          executionLog.collect(jobId, {
            entity_type: EExecutionLogEntityType.CYCLE,
            phase: "CREATE_CYCLE",
            level: EExecutionLogLevel.SUCCESS,
            entity_external_id: cycle.external_id,
            entity_plane_id: error.id,
            entity_name: cycle.name,
            already_existed: true,
          });
        }
      } else {
        logger.error(`[${jobId.slice(0, 7)}] Error while creating the cycle: ${cycle.name}`, error);

        executionLog.collect(jobId, {
          entity_type: EExecutionLogEntityType.CYCLE,
          phase: "CREATE_CYCLE",
          level: EExecutionLogLevel.ERROR,
          error: extractErrorMetadata(error),
          entity_name: cycle.name,
          entity_external_id: cycle.external_id,
        });
      }
    }
  }

  return createdCycles;
};
