import { deleteCredentialsBySourceToken, deleteCredentialsForWorkspace, getCredentialsBySourceToken } from "@/db/query";
import {
  deleteEntityConnectionByWorkspaceConnectionId,
  deleteWorkspaceConnection,
  getWorkspaceConnectionByCredentialsId,
} from "@/db/query/connection";
import { GithubWebhookPayload } from "@plane/etl/github";

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

  const credentials = await getCredentialsBySourceToken(installationId.toString());

  if (credentials && credentials.length > 0) {
    // Get the connection by it's credential id
    const credential = credentials[0];
    const connections = await getWorkspaceConnectionByCredentialsId(credential.id);

    if (connections.length === 0) return;

    const connection = connections[0];
    // Delete entity connections referencing the workspace connection
    await deleteEntityConnectionByWorkspaceConnectionId(connection.id);

    // Delete the workspace connection associated with the team
    await deleteWorkspaceConnection(connection.id);

    // Delete the team and user credentials for the workspace
    await deleteCredentialsForWorkspace(connection.workspaceId, "GITHUB");
    await deleteCredentialsForWorkspace(connection.workspaceId, "GITHUB-USER");
  }
};
