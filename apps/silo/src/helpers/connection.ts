import { E_INTEGRATION_KEYS } from "@plane/etl/core";
import { TWorkspaceConnection, TWorkspaceCredential } from "@plane/types";
import {
  githubEntityConnectionSchema,
  githubWorkspaceConnectionSchema,
  PlaneConnectionDetails,
} from "@/apps/github/types";
import { getAPIClient } from "@/services/client";
import { verifyEntityConnection, verifyWorkspaceConnection } from "@/types";

const apiClient = getAPIClient();

export const getConnectionDetailsForPlane = async (
  workspace: string,
  project: string,
  isEnterprise: boolean
): Promise<PlaneConnectionDetails> => {
  const entityConnectionArray = await apiClient.workspaceEntityConnection.listWorkspaceEntityConnections({
    workspace_id: workspace,
    entity_type: isEnterprise ? E_INTEGRATION_KEYS.GITHUB_ENTERPRISE : E_INTEGRATION_KEYS.GITHUB,
    project_id: project,
  });

  if (!entityConnectionArray || entityConnectionArray.length === 0) {
    throw new Error("Entity connection not found");
  }

  const entityConnection = verifyEntityConnection(githubEntityConnectionSchema, entityConnectionArray[0] as any);

  const workspaceConnnectionData = await apiClient.workspaceConnection.getWorkspaceConnection(
    entityConnection.workspace_connection_id
  );

  if (!workspaceConnnectionData) {
    throw new Error("Workspace connection not found");
  }

  const workspaceConnection = verifyWorkspaceConnection(
    githubWorkspaceConnectionSchema,
    workspaceConnnectionData as any
  );

  // Get the credentials from the workspace connection
  const credentials = await apiClient.workspaceCredential.getWorkspaceCredential(workspaceConnection.credential_id);

  return {
    credentials: credentials as TWorkspaceCredential,
    entityConnection,
    workspaceConnection,
  };
};

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
