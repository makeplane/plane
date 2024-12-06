import { createOrUpdateCredentials } from "@/db/query";
import { SlackUpdateCredential } from "@silo/slack";

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

    await createOrUpdateCredentials(workspaceId, userId, {
      workspace_id: workspaceId,
      source: "SLACK",
      target_access_token: targetAccessToken,
      source_access_token: sourceAccessToken,
      source_refresh_token: sourceRefreshToken,
    });
  };
