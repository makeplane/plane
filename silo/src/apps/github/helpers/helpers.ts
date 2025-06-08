import { E_INTEGRATION_KEYS } from "@plane/etl/core";

import { GithubPullRequest } from "@plane/etl/github";
import { TWorkspaceCredential, TWorkspaceEntityConnection } from "@plane/types";
import { getAPIClient } from "@/services/client";
import { verifyEntityConnection, verifyEntityConnections, verifyWorkspaceConnection } from "@/types";
import { githubEntityConnectionSchema, githubWorkspaceConnectionSchema } from "../types";

const apiClient = getAPIClient();

export const getConnectionDetails = async (props: {
  accountId: string;
  credentials: TWorkspaceCredential;
  installationId: string;
  repositoryId: string;
}): Promise<{
  workspaceConnection: ReturnType<typeof verifyWorkspaceConnection>;
  allEntityConnectionsForRepository: ReturnType<typeof verifyEntityConnections>;
  entityConnection?: ReturnType<typeof verifyEntityConnection>;
}> => {
  // Get the workspace connection for the installation
  const workspaceConnection = await apiClient.workspaceConnection.listWorkspaceConnections({
    workspace_id: props.credentials.workspace_id!,
    credential_id: props.credentials.id,
  });

  if (workspaceConnection.length === 0) {
    throw new Error("No workspace connection found for the given installation");
  }

  // Get the entity connection for the given repository
  const entityConnections = await apiClient.workspaceEntityConnection.listWorkspaceEntityConnections({
    workspace_id: props.credentials.workspace_id!,
    entity_type: E_INTEGRATION_KEYS.GITHUB,
    entity_id: props.repositoryId.toString(),
  });

  // Parse the config for the workspace connection
  const verifiedWorkspaceConnection = verifyWorkspaceConnection(
    githubWorkspaceConnectionSchema,
    workspaceConnection[0] as any
  );

  // Only verify entity connection if it exists
  const verifiedEntityConnection =
    entityConnections.length > 0
      ? verifyEntityConnection(githubEntityConnectionSchema, entityConnections[0] as any)
      : undefined;

  const verifiedEntityConnections = verifyEntityConnections(githubEntityConnectionSchema, entityConnections as any);

  return {
    workspaceConnection: verifiedWorkspaceConnection,
    entityConnection: verifiedEntityConnection,
    allEntityConnectionsForRepository: verifiedEntityConnections,
  };
};

export type MergeRequestEvent =
  | "DRAFT_MR_OPENED"
  | "MR_OPENED"
  | "MR_REVIEW_REQUESTED"
  | "MR_READY_FOR_MERGE"
  | "MR_MERGED"
  | "MR_CLOSED";

export function classifyPullRequestEvent(pull_request: GithubPullRequest): MergeRequestEvent | undefined {
  // Handle terminal states first
  if (pull_request.state === "closed") {
    return pull_request.merged ? "MR_MERGED" : "MR_CLOSED";
  }

  // Handle draft state
  if (pull_request.draft) {
    return "DRAFT_MR_OPENED";
  }

  // Check if PR is ready for merge based on properties
  if (!pull_request.draft && pull_request.mergeable && pull_request.mergeable_state === "clean") {
    return "MR_READY_FOR_MERGE";
  }

  // Handle opened/reopened states
  if (pull_request.state === "open") {
    return "MR_OPENED";
  }

  return undefined;
}
