import { SlackUpdateCredential } from "@plane/etl/slack";
import { getAPIClient } from "@/services/client";
import { E_INTEGRATION_KEYS } from "@plane/etl/core";

const apiClient = getAPIClient();

export const getRefreshCredentialHandler =
  (workspaceId: string, userId: string, targetAccessToken: string) => async (response: SlackUpdateCredential) => {
    let sourceAccessToken: string;
    let sourceRefreshToken: string;

    if (response.isBotToken) {
      sourceAccessToken = response.tokenResponse.access_token;
      sourceRefreshToken = response.tokenResponse.refresh_token;
    } else {
      sourceAccessToken = response.tokenResponse.authed_user.access_token;
      sourceRefreshToken = response.tokenResponse.authed_user.refresh_token;
    }

    await apiClient.workspaceCredential.createWorkspaceCredential({
      source: E_INTEGRATION_KEYS.SLACK,
      target_access_token: targetAccessToken,
      source_access_token: sourceAccessToken,
      source_refresh_token: sourceRefreshToken,
      workspace_id: workspaceId,
      user_id: userId,
    });
  };
