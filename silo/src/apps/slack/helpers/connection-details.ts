import { getRefreshCredentialHandler } from "./update-credentials";
import { createSlackService } from "@plane/etl/slack";
import { slackAuth } from "../auth/auth";
import { Client as PlaneClient } from "@plane/sdk";
import { getAPIClient } from "@/services/client";
import { E_INTEGRATION_KEYS } from "@plane/etl/core";


export const getConnectionDetails = async (teamId: string) => {
  const apiClient = getAPIClient();
  const [workspaceConnection] = await apiClient.workspaceConnection.listWorkspaceConnections({
    connection_id: teamId,
    connection_type: E_INTEGRATION_KEYS.SLACK,
  })


  if (!workspaceConnection) {
    throw new Error("Workspace connection not found");
  }

  // Get the credentials for the workspace connection
  const credentials = await apiClient.workspaceCredential.getWorkspaceCredential(workspaceConnection.credential_id);

  if (!credentials) {
    throw new Error("Credentials not found");
  }

  if (
    !credentials.user_id ||
    !credentials.target_access_token ||
    !credentials.source_access_token ||
    !credentials.source_refresh_token
  ) {
    throw new Error("Incomplete credentials found for associated credentials");
  }

  // Create a new SlackService instance
  const refreshHandler = getRefreshCredentialHandler(
    workspaceConnection.workspace_id,
    credentials.user_id,
    credentials.target_access_token
  );

  const slackService = createSlackService(
    credentials.source_access_token,
    credentials.source_refresh_token,
    slackAuth,
    refreshHandler
  );

  if (!workspaceConnection.target_hostname) {
    throw new Error("Target hostname not found");
  }

  const planeClient = new PlaneClient({
    apiToken: credentials.target_access_token,
    baseURL: workspaceConnection.target_hostname,
  });

  return {
    workspaceConnection,
    credentials,
    slackService,
    planeClient,
  };
};
