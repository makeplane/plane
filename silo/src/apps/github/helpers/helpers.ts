import { E_INTEGRATION_KEYS, TServiceCredentials } from "@plane/etl/core";

import { GithubWebhookPayload } from "@plane/etl/github";
import { TWorkspaceCredential } from "@plane/types";
import { getAPIClient } from "@/services/client";
import { verifyEntityConnection, verifyWorkspaceConnection } from "@/types";
import { GithubConnectionDetails, githubEntityConnectionSchema, githubWorkspaceConnectionSchema } from "../types";

const apiClient = getAPIClient();

export const getConnectionDetails = async (props: {
  accountId: string;
  credentials: TWorkspaceCredential;
  installationId: string;
  repositoryId: string;
}): Promise<GithubConnectionDetails> => {
  // Get the workspace connection for the installation
  const workspaceConnection = await apiClient.workspaceConnection.listWorkspaceConnections({
    workspace_id: props.credentials.workspace_id!,
    connection_type: E_INTEGRATION_KEYS.GITHUB,
    connection_id: props.accountId.toString(),
  });

  if (workspaceConnection.length === 0) {
    throw new Error("No workspace connection found for the given installation");
  }

  // Get the entity connection for the given repository
  const entityConnection = await apiClient.workspaceEntityConnection.listWorkspaceEntityConnections({
    workspace_id: props.credentials.workspace_id!,
    entity_type: E_INTEGRATION_KEYS.GITHUB,
    entity_id: props.repositoryId.toString(),
  });

  if (entityConnection.length === 0) {
    throw new Error("No entity connection found for the given installation");
  }

  // Parse the config for the workspace and entity connection
  const verifiedWorkspaceConnection = verifyWorkspaceConnection(
    githubWorkspaceConnectionSchema,
    workspaceConnection[0] as any
  );

  const verifiedEntityConnection = verifyEntityConnection(githubEntityConnectionSchema, entityConnection[0] as any);

  return {
    workspaceConnection: verifiedWorkspaceConnection,
    entityConnection: verifiedEntityConnection,
  };
};

export type MergeRequestEvent =
  | "DRAFT_MR_OPENED"
  | "MR_OPENED"
  | "MR_REVIEW_REQUESTED"
  | "MR_READY_FOR_MERGE"
  | "MR_MERGED"
  | "MR_CLOSED";

export function classifyPullRequestEvent(
  action: string,
  pull_request: GithubWebhookPayload["pull-request-webhook"]
): MergeRequestEvent | undefined {
  // Handle terminal states first
  if (action === "closed") {
    return pull_request.merged ? "MR_MERGED" : "MR_CLOSED";
  }

  // Handle draft state
  if (pull_request.draft) {
    return "DRAFT_MR_OPENED";
  }

  // Handle specific actions that indicate state
  if (action === "ready_for_review") {
    return "MR_READY_FOR_MERGE";
  }

  if (action === "review_requested") {
    return "MR_REVIEW_REQUESTED";
  }

  // Check if PR is ready for merge based on properties
  if (!pull_request.draft && pull_request.mergeable && pull_request.mergeable_state === "clean") {
    return "MR_READY_FOR_MERGE";
  }

  // Handle opened/reopened states
  if (action === "opened" || action === "reopened") {
    return "MR_OPENED";
  }

  return undefined;
}
