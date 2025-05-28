import { protect } from "@/lib";
import { logger } from "@/logger";
import { ExIssueType, Client as PlaneClient } from "@plane/sdk";
import { isAxiosError } from "axios";

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

      const isAxios = isAxiosError(error);
      // If the error is an axios error, check for the status
      if (isAxios) {
        if (error.response?.status === 409) {
          // refetch and issue type and return, the issue type
          const fetchedIssueType = await protect(
            planeClient.issueType.fetchById.bind(planeClient.issueType),
            workspaceSlug,
            projectId,
            error.response.data.id
          );
          createdUpdatedIssueTypes.push(fetchedIssueType);
        }
      }

      logger.error(`[${jobId.slice(0, 7)}] Error while creating or updating the issue type: ${issueType.name}`, error);
    }
  });

  await Promise.all(issueTypePromises);
  return createdUpdatedIssueTypes;
};
