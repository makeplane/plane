import { isAxiosError } from "axios";
import { ExIssueType, Client as PlaneClient } from "@plane/sdk";
import { processBatchPromises } from "@/helpers/methods";
import { protect } from "@/lib";
import { logger } from "@/logger";

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

  const createOrUpdateIssueType = async (issueType: Partial<ExIssueType>): Promise<ExIssueType | undefined> => {
    try {
      let createdUpdatedIssueType: ExIssueType | undefined;
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

      return createdUpdatedIssueType;
    } catch (error) {
      logger.error(`[${jobId.slice(0, 7)}] Error while creating or updating the issue type: ${issueType.name}`, error);
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
          return fetchedIssueType;
        }
      }

      return undefined;
    }
  }

  const createdUpdatedIssueTypes = await processBatchPromises(issueTypes, createOrUpdateIssueType, 5);

  return createdUpdatedIssueTypes.filter((issueType) => issueType !== undefined) as ExIssueType[];
};
