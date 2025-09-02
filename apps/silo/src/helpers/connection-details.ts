import {
  TWorkspaceCredential,
  E_INTEGRATION_KEYS,
  TWorkspaceConnection,
  TWorkspaceEntityConnection,
} from "@plane/types";
import { integrationConnectionHelper } from "@/helpers/integration-connection-helper";
import { logger } from "@/logger";

/**
 * Get the connection details for a workspace and entity connection
 * @param connection_type - The type of connection
 * @param connection_id - The id of the connection
 * @param entity_id - The id of the entity connection
 * @returns The connection details
 * @example
 * const { workspaceConnection, entityConnection, credential } =
 * await getConnectionDetails<TGithubWorkspaceConnection, TGithubEntityConnection>(E_INTEGRATION_KEYS.GITHUB, connection_id, entity_id);
 */

export async function getConnectionDetails<T extends TWorkspaceConnection, Z extends TWorkspaceEntityConnection>(
  connection_type: E_INTEGRATION_KEYS,
  connection_id: string,
  entity_id?: string
): Promise<{
  workspaceConnection: T;
  entityConnection?: Z;
  credential: TWorkspaceCredential;
}> {
  let workspaceConnection: T | null = null;
  let entityConnection: Z | null = null;
  let credential: TWorkspaceCredential | null = null;

  // fetch the workspace connection
  workspaceConnection = (await integrationConnectionHelper.getWorkspaceConnection({
    connection_type,
    connection_id,
  })) as T | null;

  if (!workspaceConnection) {
    logger.error(`[CONNECTION_DETAILS] Workspace connection not found for`, {
      connection_type,
      connection_id,
    });
  }

  // fetch the entity connection
  if (workspaceConnection && entity_id) {
    entityConnection = (await integrationConnectionHelper.getWorkspaceEntityConnection({
      workspace_connection_id: workspaceConnection.id,
      entity_id,
    })) as Z | null;

    if (!entityConnection) {
      logger.error(`[CONNECTION_DETAILS] Entity connection not found for`, {
        connection_type,
        connection_id,
        entity_id,
      });
    }
  }

  // fetch the credential with the workspace id and source
  credential = await integrationConnectionHelper.getWorkspaceCredential({
    credential_id: workspaceConnection?.credential_id,
  });

  if (!credential) {
    logger.error(`[CONNECTION_DETAILS] Workspace credential not found for`, {
      connection_type,
      workspace_id: workspaceConnection?.workspace_id,
    });
  }

  return {
    workspaceConnection: workspaceConnection as T,
    entityConnection: entityConnection as Z,
    credential: credential as TWorkspaceCredential,
  };
}
