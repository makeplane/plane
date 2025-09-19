import { E_INTEGRATION_KEYS } from "@plane/etl/core";
import { createGitLabService } from "@plane/etl/gitlab";
import { logger } from "@/logger";
import { getAPIClient } from "@/services/client";

const apiClient = getAPIClient();

export const getGitlabClientService = async (workspaceId: string) => {
  try {
    // Create or update credentials
    const credentials = await apiClient.workspaceCredential.listWorkspaceCredentials({
      workspace_id: workspaceId,
      source: E_INTEGRATION_KEYS.GITLAB,
    });

    if (credentials.length === 0) {
      throw new Error("No gitlab credentials available for the given workspaceId and userId");
    }

    const { source_access_token, source_refresh_token, target_access_token, user_id: userId } = credentials[0];

    if (!source_access_token || !source_refresh_token || !userId || !target_access_token) {
      throw new Error("No gitlab credentials available for the given workspaceId and userId");
    }

    const gitlabService = createGitLabService(
      source_access_token,
      source_refresh_token,
      async (access_token, refresh_token) => {
        await apiClient.workspaceCredential.createWorkspaceCredential({
          source: E_INTEGRATION_KEYS.GITLAB,
          target_access_token: target_access_token,
          source_access_token: access_token,
          source_refresh_token: refresh_token,
          workspace_id: workspaceId,
          user_id: userId,
        });
      }
    );
    return gitlabService;
  } catch (error) {
    logger.error("Failed to get gitlab client service:", error);
    throw error;
  }
};
