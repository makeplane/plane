import { getEntityConnectionByEntityId, getWorkspaceConnections } from "@/db/query/connection";
import { verifyEntityConnection, verifyWorkspaceConnection } from "@/types";
import { TServiceCredentials } from "@silo/core";
import { GithubConnectionDetails, githubEntityConnectionSchema, githubWorkspaceConnectionSchema } from "../types";

export const getConnectionDetails = async (props: {
  accountId: string;
  credentials: TServiceCredentials;
  installationId: string;
  repositoryId: string;
}): Promise<GithubConnectionDetails> => {
  // Get the workspace connection for the installation
  const workspaceConnection = await getWorkspaceConnections(
    props.credentials.workspace_id!,
    "GITHUB",
    props.accountId.toString()
  );

  if (workspaceConnection.length === 0) {
    throw new Error("No workspace connection found for the given installation");
  }

  // Get the entity connection for the given repository
  const entityConnection = await getEntityConnectionByEntityId(props.repositoryId.toString());

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

import { GithubWebhookPayload } from "@silo/github";

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
): MergeRequestEvent {
  if (pull_request.draft) {
    return "DRAFT_MR_OPENED";
  }

  switch (action) {
    case "opened":
    case "reopened":
      return "MR_OPENED";
    case "review_requested":
      return "MR_REVIEW_REQUESTED";
    case "ready_for_review":
      return "MR_READY_FOR_MERGE";
    case "closed":
      return pull_request.merged ? "MR_MERGED" : "MR_CLOSED";
  }

  if (pull_request.mergeable && pull_request.mergeable_state === "clean" && !pull_request.draft) {
    return "MR_READY_FOR_MERGE";
  }

  return "MR_OPENED";
}
