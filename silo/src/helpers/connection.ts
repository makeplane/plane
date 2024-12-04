import {
  githubEntityConnectionSchema,
  githubWorkspaceConnectionSchema,
  PlaneConnectionDetails,
} from "@/apps/github/types";
import { getCredentialsById } from "@/db/query";
import { getEntityConnectionByWorkspaceAndProjectId, getWorkspaceConnectionById } from "@/db/query/connection";
import { verifyEntityConnection, verifyWorkspaceConnection } from "@/types";
import { TServiceCredentials } from "@silo/core";

export const getConnectionDetailsForPlane = async (
  workspace: string,
  project: string
): Promise<PlaneConnectionDetails> => {
  const entityConnectionArray = await getEntityConnectionByWorkspaceAndProjectId(workspace, project);

  if (!entityConnectionArray || entityConnectionArray.length === 0) {
    throw new Error("Entity connection not found");
  }

  const entityConnection = verifyEntityConnection(githubEntityConnectionSchema, entityConnectionArray[0] as any);

  const workspaceConnectionArray = await getWorkspaceConnectionById(entityConnection.workspaceConnectionId);

  if (!workspaceConnectionArray || workspaceConnectionArray.length === 0) {
    throw new Error("Workspace connection not found");
  }

  const workspaceConnection = verifyWorkspaceConnection(
    githubWorkspaceConnectionSchema,
    workspaceConnectionArray[0] as any
  );

  // Get the credentials from the workspace connection
  const credentialsArray = await getCredentialsById(workspaceConnection.credentialsId);
  const credentials = credentialsArray[0];

  return {
    credentials: credentials as TServiceCredentials,
    entityConnection,
    workspaceConnection,
  };
};
