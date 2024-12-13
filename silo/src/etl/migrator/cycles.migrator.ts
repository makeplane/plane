import { AssertAPIErrorResponse, protect } from "@/lib";
import { logger } from "@/logger";
import { ExCycle, ExIssue, Client as PlaneClient } from "@plane/sdk";
import { getJobData } from "@/apps/jira-importer/helpers/migration-helpers";

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
      const createdCycle: any = await protect(
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
                  job.migration_type
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
