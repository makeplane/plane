import { gitlabEntityConnectionSchema, GitlabMergeRequestEvent, gitlabWorkspaceConnectionSchema } from "@silo/gitlab";
import { GitlabConnectionDetails } from "../types";
import { getEntityConnectionByEntityId, getWorkspaceConnectionById } from "@/db/query/connection";
import { logger } from "@/logger";
import { verifyEntityConnection, verifyWorkspaceConnection } from "@/types";

export const getGitlabConnectionDetails = async (
  data: GitlabMergeRequestEvent
): Promise<GitlabConnectionDetails | undefined> => {
  const entityConnectionSet = await getEntityConnectionByEntityId(data.project.id.toString());

  if (!entityConnectionSet || entityConnectionSet.length === 0) {
    logger.error(`[GITLAB] Entity connection not found for project ${data.project.id}, skipping...`);
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

  const verifiedWorkspaceConnection = verifyWorkspaceConnection(
    gitlabWorkspaceConnectionSchema,
    workspaceConnection as any
  );

  const verifiedEntityConnection = verifyEntityConnection(gitlabEntityConnectionSchema, entityConnection as any);

  return {
    workspaceConnection: verifiedWorkspaceConnection,
    entityConnection: verifiedEntityConnection,
  };
};
