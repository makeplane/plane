import { E_INTEGRATION_KEYS, TWorkspaceConnection } from "@plane/types";
import { getAPIClient } from "@/services/client";

const apiClient = getAPIClient();

export const createOrUpdateConnection = async (
  workspaceId: string,
  connection_type: E_INTEGRATION_KEYS,
  connection: Partial<TWorkspaceConnection<any>>,
  connectionId?: string
) => {
  const connections = await apiClient.workspaceConnection.listWorkspaceConnections({
    workspace_id: workspaceId,
    connection_type: connection_type,
    connection_id: connectionId,
  });

  if (connections.length > 1) {
    throw new Error("More than one connections exist.");
  }

  if (connections.length === 0) {
    // Create a new connection
    await apiClient.workspaceConnection.createWorkspaceConnection(connection);
  } else {
    const targetConnection = connections[0];
    if (targetConnection.id) {
      await apiClient.workspaceConnection.updateWorkspaceConnection(targetConnection.id, connection);
    }
  }
};
