import { SlackTokenRefreshResponse } from "@plane/etl/slack";
import { getAPIClient } from "@/services/client";
import { E_INTEGRATION_KEYS } from "@plane/etl/core";

const apiClient = getAPIClient();

export const getRefreshCredentialHandler =
  (workspaceId: string, userId: string, targetAccessToken: string, isUser: boolean = false) =>
  async (response: SlackTokenRefreshResponse) => {
    const sourceAccessToken = response.access_token;
    const sourceRefreshToken = response.refresh_token;
    const source = isUser ? `${E_INTEGRATION_KEYS.SLACK}-USER` : E_INTEGRATION_KEYS.SLACK;

    /*
      Workspace credentials endpoint supports upserting credentials,
      so we can just create the credential and it will be updated if it already exists
    */
    await apiClient.workspaceCredential.createWorkspaceCredential({
      source,
      target_access_token: targetAccessToken,
      source_access_token: sourceAccessToken,
      source_refresh_token: sourceRefreshToken,
      workspace_id: workspaceId,
      user_id: userId,
    });
  };
