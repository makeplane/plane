import { getCredentialsById } from "@/db/query";
import { getWorkspaceConnectionByConnectionId } from "@/db/query/connection";
import { getRefreshCredentialHandler } from "./update-credentials";
import { createSlackService } from "@silo/slack";
import { slackAuth } from "../auth/auth";
import { Client as PlaneClient } from "@plane/sdk";

export const getConnectionDetails = async (teamId: string) => {
  const [workspaceConnection] = await getWorkspaceConnectionByConnectionId(teamId, "SLACK");

  if (!workspaceConnection) {
    throw new Error("Workspace connection not found");
  }

  // Get the credentials for the workspace connection
  const [credentials] = await getCredentialsById(workspaceConnection.credentialsId);

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
    workspaceConnection.workspaceId,
    credentials.user_id,
    credentials.target_access_token
  );

  const slackService = createSlackService(
    credentials.source_access_token,
    credentials.source_refresh_token,
    slackAuth,
    refreshHandler
  );

  const planeClient = new PlaneClient({
    apiToken: credentials.target_access_token,
    baseURL: workspaceConnection.targetHostname,
  });

  return {
    workspaceConnection,
    credentials,
    slackService,
    planeClient,
  };
};
