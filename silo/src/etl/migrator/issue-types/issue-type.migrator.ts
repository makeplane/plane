import { protect } from "@/lib";
import { logger } from "@/logger";
import { ExIssueType, Client as PlaneClient } from "@plane/sdk";

type TCreateOrUpdateIssueTypes = {
  jobId: string;
  issueTypes: Partial<ExIssueType>[];
  planeClient: PlaneClient;
  workspaceSlug: string;
  projectId: string;
  method: "create" | "update";
};

export const createOrUpdateIssueTypes = async (props: TCreateOrUpdateIssueTypes): Promise<ExIssueType[]> => {
  const { jobId, issueTypes, planeClient, workspaceSlug, projectId, method } = props;
  const createdUpdatedIssueTypes: ExIssueType[] = [];

  const issueTypePromises = issueTypes.map(async (issueType) => {
    try {
      let createdUpdatedIssueType: any;
      if (method === "create") {
        createdUpdatedIssueType = await protect(
          planeClient.issueType.create.bind(planeClient.issueType),
          workspaceSlug,
          projectId,
          issueType
        );
      } else {
        createdUpdatedIssueType = await protect(
          planeClient.issueType.update.bind(planeClient.issueType),
          workspaceSlug,
          projectId,
          issueType.id,
          issueType
        );
      }
      if (createdUpdatedIssueType) {
        createdUpdatedIssueTypes.push(createdUpdatedIssueType);
      }
    } catch (error) {
      logger.error(`[${jobId.slice(0, 7)}] Error while creating or updating the issue type: ${issueType.name}`, error);
    }
  });

  await Promise.all(issueTypePromises);
  return createdUpdatedIssueTypes;
};
