import { E_INTEGRATION_KEYS } from "@plane/etl/core";
import { createSlackService } from "@plane/etl/slack";
import { Client as PlaneClient, PlaneWebhookPayload } from "@plane/sdk";
import { TWorkspaceCredential, TWorkspaceConnection } from "@plane/types";
import { env } from "@/env";
import { logger } from "@/logger";
import { getAPIClient } from "@/services/client";
import { slackAuth } from "../auth/auth";
import { TSlackConnectionDetails, TSlackWorkspaceConnectionConfig } from "../types/types";
import { getRefreshCredentialHandler } from "./update-credentials";

const apiClient = getAPIClient();

export const getConnectionDetails = async (
  teamId: string,
  slackUser?: { id: string; email?: string }
): Promise<TSlackConnectionDetails | null> => {
  const [workspaceConnection] = await apiClient.workspaceConnection.listWorkspaceConnections({
    connection_id: teamId,
    connection_type: E_INTEGRATION_KEYS.SLACK,
  });

  if (!workspaceConnection) {
    logger.info(`[SLACK] Workspace connection not found for team ${teamId}`);
    return null;
  }

  // First get admin credentials to ensure we have a SlackService regardless
  const adminCredentials = await apiClient.workspaceCredential.getWorkspaceCredential(
    workspaceConnection.credential_id
  );

  if (
    !adminCredentials ||
    !adminCredentials.source_access_token ||
    !adminCredentials.source_refresh_token ||
    !adminCredentials.target_access_token
  ) {
    logger.info(`[SLACK] Admin credentials not found for team ${teamId}`);
    return null;
  }

  // Create admin-based SlackService that we can use regardless of user credential state
  const refreshHandler = getRefreshCredentialHandler(
    workspaceConnection.workspace_id,
    adminCredentials.user_id as string,
    adminCredentials.target_access_token as string,
  );

  const slackService = createSlackService(
    adminCredentials.source_access_token,
    adminCredentials.source_refresh_token,
    slackAuth,
    refreshHandler
  );

  // Try to get user credentials
  const userCredentials = slackUser
    ? await getCredentialsWithFallback(
      workspaceConnection as unknown as TWorkspaceConnection<TSlackWorkspaceConnectionConfig>,
      slackUser
    )
    : null;

  // Use user credentials if available, otherwise use admin credentials
  const credentials = userCredentials || adminCredentials;

  const planeClient = new PlaneClient({
    apiToken: credentials.target_access_token as string,
    baseURL: env.API_BASE_URL,
  });

  return {
    workspaceConnection,
    credentials,
    botCredentials: adminCredentials,
    slackService,
    planeClient,
    missingUserCredentials: !userCredentials,
  };
};

const getCredentialsWithFallback = async (
  workspaceConnection: TWorkspaceConnection<TSlackWorkspaceConnectionConfig>,
  slackUser?: { id: string; email?: string }
): Promise<TWorkspaceCredential | null> => {
  let credentials: TWorkspaceCredential | null = null;

  if (!slackUser) return null;

  // Get the credentials for the workspace connection
  const planeUser = await findPlaneUserId(workspaceConnection, slackUser);
  if (!planeUser) return null;

  // If the Plane User is found, let's check for the credentials for that particular user
  const userCredentials = await apiClient.workspaceCredential.listWorkspaceCredentials({
    user_id: planeUser,
    workspace_id: workspaceConnection.workspace_id,
    source: `${E_INTEGRATION_KEYS.SLACK}-USER`,
  });

  if (!userCredentials || userCredentials.length === 0) {
    // TODO: Send a message to the same channel where the user is in order to notify the user to connect their account
    logger.info(
      `[SLACK] Credentials not found for user ${slackUser.email} in the workspace ${workspaceConnection.workspace_slug}`
    );
    return null;
  }

  // Nice... here we have the credentials for the user
  credentials = userCredentials[0];

  return credentials;
};

/**
 * Find Plane user ID from a Slack user
 */
export const findPlaneUserId = async (
  workspaceConnection: TWorkspaceConnection<TSlackWorkspaceConnectionConfig>,
  slackUser: { id: string; email?: string }
): Promise<string | null> => {
  // Check for the userId in the workspace connection map
  const config = workspaceConnection.config as TSlackWorkspaceConnectionConfig;

  let planeUser: string | null = null;

  // If we have the user map, let's check for the user in the map
  if (config?.userMap?.length) {
    planeUser = config.userMap.find((user) => user.slackUser === slackUser.id)?.planeUserId ?? null;
  }

  // If we don't have the user in the user map, let's get the members and compare the emails in order to find the user
  if (!planeUser) {
    // Get the admin credentials and initialize the plane client
    const adminCredentials = await apiClient.workspaceCredential.getWorkspaceCredential(
      workspaceConnection.credential_id
    );

    if (!adminCredentials || !adminCredentials.target_access_token) {
      logger.info(`[SLACK] Admin credentials not found for team ${workspaceConnection.id}`);
      return null;
    }

    const adminPlaneClient = new PlaneClient({
      apiToken: adminCredentials.target_access_token,
      baseURL: env.API_BASE_URL,
    });

    // Get the members from the workspace and compare the emails in order to find the user
    const members = await adminPlaneClient.users.listAllUsers(workspaceConnection.workspace_slug);
    planeUser = members.find((member) => member.email === slackUser.email)?.id ?? null;

    if (!planeUser) {
      // This case can hit if the user is an external customer and doesn't have access to the plane workspace
      logger.info(`[SLACK] User ${slackUser.email} not found in the workspace ${workspaceConnection.workspace_slug}`);
      return null;
    } else {
      // Let's update the workspace connection with the user id
      await updateUserMap(workspaceConnection, planeUser, slackUser.id);
      return planeUser;
    }
  }

  return planeUser;
};

/**
 * Update the user map by adding or removing entries
 *
 * @param workspaceConnection The workspace connection to update
 * @param planeUserId The Plane user ID (can be null to remove entries)
 * @param slackUserId The Slack user ID (can be null to remove entries)
 * @returns Promise that resolves when the update is complete
 */
export const updateUserMap = async (
  workspaceConnection: TWorkspaceConnection<TSlackWorkspaceConnectionConfig>,
  planeUserId: string | null,
  slackUserId: string | null
): Promise<void> => {
  const existingConfig = workspaceConnection.config || {};
  const existingUserMap = (existingConfig as TSlackWorkspaceConnectionConfig)?.userMap || [];
  // If both IDs are null, no changes needed
  if (!planeUserId && !slackUserId) return;
  // Filter out any existing mappings that match either ID being removed
  const filteredMap = existingUserMap.filter(
    (entry) =>
      (planeUserId === null || entry.planeUserId !== planeUserId) &&
      (slackUserId === null || entry.slackUser !== slackUserId)
  );
  // Add new mapping if both IDs are provided
  const newUserMap =
    planeUserId && slackUserId ? [...filteredMap, { planeUserId, slackUser: slackUserId }] : filteredMap;
  // Only update if the map has changed
  if (JSON.stringify(newUserMap) !== JSON.stringify(existingUserMap)) {
    await apiClient.workspaceConnection.updateWorkspaceConnection(workspaceConnection.id, {
      config: {
        ...existingConfig,
        userMap: newUserMap,
      },
    });
  }
};

/*
 From plane sometimes we need to perform actions on behalf of a user or bot,
 when required to perform on behalf of a user, provide the planeUserId,
*/
export const getConnectionDetailsForIssue = async (payload: PlaneWebhookPayload, planeUserId: string | null) => {
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

  let credentials: TWorkspaceCredential | null = null;
  let isUser = false;

  // If planeUserId is provided, let's check for the credentials for that particular user
  if (planeUserId) {
    const userCredentials = await apiClient.workspaceCredential.listWorkspaceCredentials({
      source: `${E_INTEGRATION_KEYS.SLACK}-USER`,
      user_id: planeUserId,
      workspace_id: workspaceConnection.workspace_id,
    });

    if (userCredentials && userCredentials.length > 0) {
      credentials = userCredentials[0];
      isUser = true;
    }
  }

  if (!credentials) {
    credentials = await apiClient.workspaceCredential.getWorkspaceCredential(workspaceConnection.credential_id);
    isUser = false;
  }

  if (!credentials || !credentials.source_access_token || !credentials.source_refresh_token || !credentials.target_access_token) {
    logger.info(`[SLACK] [GET_CONNECTION_DETAILS_FOR_ISSUE] Credentials not found for entity connection ${entityConnection.id}`);
    return;
  }

  const refreshHandler = getRefreshCredentialHandler(
    workspaceConnection.workspace_id,
    credentials.user_id,
    credentials.target_access_token,
    isUser
  );

  const slackService = createSlackService(
    credentials.source_access_token,
    credentials.source_refresh_token,
    slackAuth,
    refreshHandler
  );

  return {
    workspaceConnection,
    entityConnection,
    slackService,
    isUser,
  };
};
