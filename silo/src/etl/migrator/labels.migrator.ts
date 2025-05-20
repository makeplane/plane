import { ExIssueLabel, Client as PlaneClient } from "@plane/sdk";
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
  // TODO: May hit race conditions
  const createdLabels: ExIssueLabel[] = [];

  const labelPromises = labels.map(async (label) => {
    try {
      const createdLabel: any = await protect(
        planeClient.label.create.bind(planeClient.label),
        workspaceSlug,
        projectId,
        label
      );
      if (createdLabel) {
        createdLabels.push(createdLabel);
      }
    } catch (error) {
      logger.error(`[${jobId.slice(0, 7)}] Error while creating the label: ${label.name}`, error);
    }
  });

  await Promise.all(labelPromises);
  return createdLabels;
};
