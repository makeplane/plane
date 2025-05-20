import { E_ENTITY_CONNECTION_KEYS, E_INTEGRATION_KEYS } from "@plane/etl/core";
import { GithubWebhookPayload } from "@plane/etl/github";
import { E_GITHUB_DISCONNECT_SOURCE } from "@/apps/github/types";
import { getAPIClient } from "@/services/client";
import { planeOAuthService } from "@/services/oauth/auth";

const apiClient = getAPIClient();

export const handleInstallationEvents = async (action: string, data: unknown): Promise<boolean> => {
  switch (action) {
    case "deleted": {
      await handleInstallationDeletion(data as unknown as GithubWebhookPayload["webhook-installation-deleted"]);
      return true;
    }
    default: {
      return false;
    }
  }
};

export const handleInstallationDeletion = async (data: GithubWebhookPayload["webhook-installation-deleted"]) => {
  const installationId = data.installation.id;

  const credentials = await apiClient.workspaceCredential.listWorkspaceCredentials({
    source: E_INTEGRATION_KEYS.GITHUB,
    source_access_token: installationId.toString(),
  });

  if (credentials && credentials.length > 0) {
    // Get the connection by it's credential id
    const credential = credentials[0];
    const connections = await apiClient.workspaceConnection.listWorkspaceConnections({
      connection_type: E_INTEGRATION_KEYS.GITHUB,
      credential_id: credential.id,
    });

    if (connections.length === 0) return;

    const connection = connections[0];
    // Delete the workspace connection associated with the team
    await apiClient.workspaceConnection.deleteWorkspaceConnection(connection.id, {
      disconnect_source: E_GITHUB_DISCONNECT_SOURCE.WEBHOOK_DISCONNECT,
      disconnected_by: "external-service",
      data: data,
    });

    // delete the token from the cache
    await planeOAuthService.deleteTokenFromCache(credential);
    // delete the associated users token
    const userCredentials = await apiClient.workspaceCredential.listWorkspaceCredentials({
      source: E_ENTITY_CONNECTION_KEYS.GITHUB_USER,
      workspace_id: credential.workspace_id,
    });

    if (userCredentials.length > 0) {
      userCredentials.forEach(async (userCredential) => {
        await planeOAuthService.deleteTokenFromCache(userCredential);
      });
    }
  }
};
