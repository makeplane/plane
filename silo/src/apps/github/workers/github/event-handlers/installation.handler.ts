import { E_INTEGRATION_KEYS } from "@plane/etl/core";
import { GithubWebhookPayload } from "@plane/etl/github";
import { getAPIClient } from "@/services/client";

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
    await apiClient.workspaceConnection.deleteWorkspaceConnection(connection.id);
    await apiClient.workspaceCredential.deleteWorkspaceCredential(credential.id);
  }
};
