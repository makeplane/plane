import { E_INTEGRATION_KEYS } from "@plane/etl/core";

import { EGithubEntityConnectionType, GithubPullRequest } from "@plane/etl/github";
import { TGithubEntityConnection, TGithubWorkspaceConnection, TWorkspaceCredential } from "@plane/types";
import { getAPIClient } from "@/services/client";

const apiClient = getAPIClient();

export const getConnDetailsForGithubToPlaneSync = async (props: {
  wsAdminCredentials: TWorkspaceCredential;
  isEnterprise: boolean;
  type: EGithubEntityConnectionType;
  repositoryId?: string;
  planeProjectId?: string;
}): Promise<{
  workspaceConnection: TGithubWorkspaceConnection;
  entityConnectionForRepository: TGithubEntityConnection;
  projectConnection: TGithubEntityConnection;
  allEntityConnections: TGithubEntityConnection[];
}> => {
  const { wsAdminCredentials: credentials, isEnterprise, type, repositoryId, planeProjectId } = props;
  // Get the workspace connection for the installation
  const workspaceConnection = await apiClient.workspaceConnection.listWorkspaceConnections({
    workspace_id: credentials.workspace_id!,
    credential_id: credentials.id,
  });

  if (workspaceConnection.length === 0) {
    throw new Error("No workspace connection found for the given installation");
  }

  const entityConnections = await apiClient.workspaceEntityConnection.listWorkspaceEntityConnections({
    workspace_id: credentials.workspace_id!,
    entity_type: isEnterprise ? E_INTEGRATION_KEYS.GITHUB_ENTERPRISE : E_INTEGRATION_KEYS.GITHUB,
    type: type,
  });

  const projectConnection = entityConnections.find(
    (entityConnection) => entityConnection.project_id === planeProjectId
  );

  const entityConnectionForRepository = entityConnections.find(
    (entityConnection) => entityConnection.entity_id === repositoryId
  );

  return {
    workspaceConnection: workspaceConnection[0] as TGithubWorkspaceConnection,
    entityConnectionForRepository: entityConnectionForRepository as TGithubEntityConnection,
    projectConnection: projectConnection as TGithubEntityConnection,
    allEntityConnections: entityConnections as TGithubEntityConnection[],
  };
};

export const getConnDetailsForPlaneToGithubSync = async (
  workspace: string,
  project: string,
  isEnterprise: boolean
): Promise<{
  credentials: TWorkspaceCredential;
  entityConnection: TGithubEntityConnection;
  workspaceConnection: TGithubWorkspaceConnection;
}> => {
  const entityConnectionArray = await apiClient.workspaceEntityConnection.listWorkspaceEntityConnections({
    workspace_id: workspace,
    type: EGithubEntityConnectionType.PROJECT_ISSUE_SYNC,
    entity_type: isEnterprise ? E_INTEGRATION_KEYS.GITHUB_ENTERPRISE : E_INTEGRATION_KEYS.GITHUB,
    project_id: project,
  });

  if (!entityConnectionArray || entityConnectionArray.length === 0) {
    throw new Error("Entity connection not found");
  }

  const entityConnection = entityConnectionArray[0] as TGithubEntityConnection;

  const workspaceConnnectionData = await apiClient.workspaceConnection.getWorkspaceConnection(
    entityConnection.workspace_connection_id
  );

  if (!workspaceConnnectionData) {
    throw new Error("Workspace connection not found");
  }

  const workspaceConnection = workspaceConnnectionData as TGithubWorkspaceConnection;

  // Get the credentials from the workspace connection
  const credentials = await apiClient.workspaceCredential.getWorkspaceCredential(workspaceConnection.credential_id);

  return {
    credentials: credentials as TWorkspaceCredential,
    entityConnection: entityConnection as TGithubEntityConnection,
    workspaceConnection: workspaceConnection as TGithubWorkspaceConnection,
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
