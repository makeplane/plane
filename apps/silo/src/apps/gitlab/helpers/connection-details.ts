import {
  EConnectionType,
  gitlabEntityConnectionSchema,
  GitlabMergeRequestEvent,
  gitlabWorkspaceConnectionSchema,
} from "@plane/etl/gitlab";
import { logger } from "@/logger";
import { getAPIClient } from "@/services/client";
import { verifyEntityConnection, verifyEntityConnections, verifyWorkspaceConnection } from "@/types";
import { GitlabConnectionDetails } from "../types";

const apiClient = getAPIClient();

export const getGitlabConnectionDetails = async (
  data: GitlabMergeRequestEvent
): Promise<GitlabConnectionDetails | undefined> => {
  // for connection now user can also just have a group connection
  // project payload has array of groups attached to it so we need to check
  // if we have any group connections among them and use that or not then check for project connection

  // later we'll check for group connections already done for a project

  if (!data.project.id) {
    logger.error(`[GITLAB] Project id not found for project ${data.project.id}, skipping...`);
    return;
  }

  const [entityConnection] = await apiClient.workspaceEntityConnection.listWorkspaceEntityConnections({
    entity_id: data.project.id.toString(),
    type: EConnectionType.ENTITY,
  });

  if (!entityConnection) {
    logger.error(`[GITLAB] Entity connection not found for project ${data.project.id}, skipping...`);
    return;
  }

  const verifiedEntityConnection = verifyEntityConnection(gitlabEntityConnectionSchema, entityConnection as any);

  // Find the workspace connection for the project
  const workspaceConnection = await apiClient.workspaceConnection.getWorkspaceConnection(
    entityConnection.workspace_connection_id
  );

  if (!workspaceConnection) {
    logger.error(`[GITLAB] Workspace connection not found for project ${data.project.id}, skipping...`);
    return;
  }

  const verifiedWorkspaceConnection = verifyWorkspaceConnection(
    gitlabWorkspaceConnectionSchema,
    workspaceConnection as any
  );

  // project connections for this workspace connection for target state mapping
  const projectConnectionSet = await apiClient.workspaceEntityConnection.listWorkspaceEntityConnections({
    workspace_connection_id: workspaceConnection.id,
    type: EConnectionType.PLANE_PROJECT,
  });

  if (projectConnectionSet.length === 0) {
    logger.error(`[GITLAB] Plane Project connection not found for project ${data.project.id}, skipping...`);

    return {
      workspaceConnection: verifiedWorkspaceConnection,
      entityConnection: verifiedEntityConnection,
    };
  }

  const verifiedProjectConnection = verifyEntityConnections(gitlabEntityConnectionSchema, projectConnectionSet as any);

  return {
    workspaceConnection: verifiedWorkspaceConnection,
    entityConnection: verifiedEntityConnection,
    projectConnections: verifiedProjectConnection,
  };
};
