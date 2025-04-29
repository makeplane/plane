import { E_INTEGRATION_KEYS } from "@plane/etl/core";
import { createSlackService, SlackService } from "@plane/etl/slack";
import { Client as PlaneClient, PlaneWebhookPayload } from "@plane/sdk";
import { env } from "@/env";
import { logger } from "@/logger";
import { getAPIClient } from "@/services/client";
import { slackAuth } from "../auth/auth";
import { getRefreshCredentialHandler } from "./update-credentials";
import { TWorkspaceConnection, TWorkspaceCredential } from "@plane/types";

export type SlackConnectionDetails = {
  workspaceConnection: TWorkspaceConnection;
  credentials: TWorkspaceCredential;
  slackService: SlackService;
  planeClient: PlaneClient;
}

const apiClient = getAPIClient();

export const getConnectionDetails = async (teamId: string): Promise<SlackConnectionDetails | null> => {
  const [workspaceConnection] = await apiClient.workspaceConnection.listWorkspaceConnections({
    connection_id: teamId,
    connection_type: E_INTEGRATION_KEYS.SLACK,
  })


  if (!workspaceConnection) {
    logger.info(`[SLACK] Workspace connection not found for team ${teamId}`);
    return null;
  }

  // Get the credentials for the workspace connection
  const credentials = await apiClient.workspaceCredential.getWorkspaceCredential(workspaceConnection.credential_id);

  if (!credentials) {
    logger.info(`[SLACK] Credentials not found for team ${teamId}`);
    return null;
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

  const planeClient = new PlaneClient({
    apiToken: credentials.target_access_token,
    baseURL: env.API_BASE_URL
  });

  return {
    workspaceConnection,
    credentials,
    slackService,
    planeClient,
  };
};


export const getConnectionDetailsForIssue = async (payload: PlaneWebhookPayload) => {
  const [entityConnection] = await apiClient.workspaceEntityConnection.listWorkspaceEntityConnections({
    workspace_id: payload.workspace,
    project_id: payload.project,
    issue_id: payload.id,
  });

  if (!entityConnection) {
    return;
  }

  const workspaceConnection = await apiClient.workspaceConnection.getWorkspaceConnection(
    entityConnection.workspace_connection_id
  );
  if (!workspaceConnection) {
    return;
  }

  const credentials = await apiClient.workspaceCredential.getWorkspaceCredential(workspaceConnection.credential_id);

  if (!credentials) {
    return;
  }

  if (!credentials.source_access_token || !credentials.source_refresh_token || !credentials.target_access_token) {
    return;
  }

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

  return {
    entityConnection,
    slackService,
  };
};
