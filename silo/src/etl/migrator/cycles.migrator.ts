import { ExCycle, ExIssue, Client as PlaneClient } from "@plane/sdk";
import { getJobData } from "@/helpers/job";
import { AssertAPIErrorResponse, protect } from "@/lib";
import { logger } from "@/logger";

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
            cycleIssueIds.filter((issue: string | undefined) => issue !== undefined) as string[]
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
