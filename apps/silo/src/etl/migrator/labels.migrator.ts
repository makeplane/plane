import { ExIssueLabel, Client as PlaneClient } from "@plane/sdk";
import { processBatchPromises } from "@/helpers/methods";
import { protect } from "@/lib";
import { logger } from "@/logger";

/* ----------------------------- Label Creation Utilities ----------------------------- */
export const createLabelsForIssues = async (
  jobId: string,
  labels: ExIssueLabel[],
  planeClient: PlaneClient,
  workspaceSlug: string,
  projectId: string
): Promise<ExIssueLabel[]> => {
  const createOrUpdateLabel = async (label: ExIssueLabel): Promise<ExIssueLabel | undefined> => {
    try {
      const createdLabel: ExIssueLabel | undefined = await protect(
        planeClient.label.create.bind(planeClient.label),
        workspaceSlug,
        projectId,
        label
      );
      if (createdLabel) {
        return createdLabel;
      }

      return undefined;
    } catch (error) {
      logger.error(`[${jobId.slice(0, 7)}] Error while creating the label: ${label.name}`);
      return undefined;
    }
  };

  const createdLabels = await processBatchPromises(labels, createOrUpdateLabel, 5);
  return createdLabels.filter((label) => label !== undefined) as ExIssueLabel[];
};
