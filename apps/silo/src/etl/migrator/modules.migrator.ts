import { logger } from "@plane/logger";
import { ExIssue, ExModule, Client as PlaneClient } from "@plane/sdk";
import { getJobData } from "@/helpers/job";
import { processBatchPromises } from "@/helpers/methods";
import { AssertAPIErrorResponse, protect } from "@/lib";

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
