import {
  EConnectionType,
  gitlabEntityConnectionSchema,
  GitlabMergeRequestEvent,
  gitlabWorkspaceConnectionSchema,
  MergeRequestEvent,
} from "@plane/etl/gitlab";
import { GitlabConnectionDetails, GitlabEntityConnection } from "../types";
import { getAllEntityConnectionsByEntityIds, getEntityConnectionByEntityId, getEntityConnectionByWorkspaceConnectionAndProjectId, getWorkspaceConnectionById } from "@/db/query/connection";
import { logger } from "@/logger";
import { verifyEntityConnection, verifyEntityConnections, verifyWorkspaceConnection } from "@/types";

export const getGitlabConnectionDetails = async (
  data: GitlabMergeRequestEvent
): Promise<GitlabConnectionDetails | undefined> => {
  // for connection now user can also just have a group connection
  // project payload has array of groups attached to it so we need to check
  // if we have any group connections among them and use that or not then check for project connection

  const projectRelatedGroups = data.project.shared_with_groups.map((group) => group.group_id?.toString());
  const entityConnectionIds = projectRelatedGroups.concat(data.project.id.toString());
  const entityConnectionSet = await getAllEntityConnectionsByEntityIds(entityConnectionIds);

  if (!entityConnectionSet || entityConnectionSet.length === 0) {
    logger.error(`[GITLAB] Entity connection not found for project ${entityConnectionIds}, skipping...`);
    return;
  }

  const entityConnection = entityConnectionSet[0];

  // Find the workspace connection for the project
  const workspaceConnectionSet = await getWorkspaceConnectionById(entityConnection.workspaceConnectionId);

  if (!workspaceConnectionSet || workspaceConnectionSet.length === 0) {
    logger.error(`[GITLAB] Workspace connection not found for project ${data.project.id}, skipping...`);
    return;
  }

  const workspaceConnection = workspaceConnectionSet[0];

  // project connections for this workspace connection for target state mapping
  let projectConnectionSet = await getEntityConnectionByWorkspaceConnectionAndProjectId(workspaceConnection.id);
  projectConnectionSet = projectConnectionSet.filter((connection) => connection.connectionType === EConnectionType.PLANE_PROJECT);

  if (projectConnectionSet.length === 0) {
    logger.error(`[GITLAB] Plane Project connection not found for project ${data.project.id}, skipping...`);
    return;
  }

  const verifiedWorkspaceConnection = verifyWorkspaceConnection(
    gitlabWorkspaceConnectionSchema,
    workspaceConnection as any
  );

  const verifiedEntityConnection = verifyEntityConnection(gitlabEntityConnectionSchema, entityConnection as any);

  const verifiedProjectConnection = verifyEntityConnections(gitlabEntityConnectionSchema, projectConnectionSet as any);

  return {
    workspaceConnection: verifiedWorkspaceConnection,
    entityConnection: verifiedEntityConnection,
    projectConnections: verifiedProjectConnection,
  };
};
