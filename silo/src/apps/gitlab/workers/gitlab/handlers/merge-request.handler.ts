import { E_INTEGRATION_KEYS } from "@plane/etl/core";
import { GitlabMergeRequestEvent } from "@plane/etl/gitlab";
import { TWorkspaceCredential } from "@plane/types";
import { getGitlabConnectionDetails } from "@/apps/gitlab/helpers/connection-details";
import { GitlabIntegrationService } from "@/apps/gitlab/services/gitlab.service";
import { GitlabConnectionDetails } from "@/apps/gitlab/types";
import { getPlaneAPIClient } from "@/helpers/plane-api-client";
import { PullRequestBehaviour } from "@/lib/behaviours";
import { logger } from "@/logger";
import { getAPIClient } from "@/services/client";

const apiClient = getAPIClient();

const getConnectionAndCredentials = async (
  data: GitlabMergeRequestEvent
): Promise<[GitlabConnectionDetails, TWorkspaceCredential] | null> => {
  console.log(data);
  const connectionDetails = await getGitlabConnectionDetails(data);
  if (!connectionDetails) {
    logger.error(`[GITLAB] Connection details not found for project ${data.project.id}, skipping...`);
    return null;
  }

  const credentials = await apiClient.workspaceCredential.getWorkspaceCredential(
    connectionDetails.workspaceConnection.credential_id
  );
  if (!credentials) {
    logger.error(`[GITLAB] Credentials not found for project ${data.project.id}, skipping...`);
    return null;
  }

  return [connectionDetails, credentials];
};

export const handleMergeRequest = async (data: GitlabMergeRequestEvent) => {
  try {
    const result = await getConnectionAndCredentials(data);
    if (!result) return;

    const [{ workspaceConnection, projectConnections }, credentials] = result;

    const planeClient = await getPlaneAPIClient(credentials, E_INTEGRATION_KEYS.GITLAB);

    const refreshTokenCallback = async (access_token: string, refresh_token: string) => {
      await apiClient.workspaceCredential.createWorkspaceCredential({
        source: E_INTEGRATION_KEYS.GITLAB,
        target_access_token: credentials.target_access_token,
        source_access_token: access_token,
        source_refresh_token: refresh_token,
        workspace_id: workspaceConnection.workspace_id,
        user_id: credentials.user_id!,
      });
    };

    const gitlabService = new GitlabIntegrationService(
      credentials.source_access_token!,
      credentials.source_refresh_token!,
      refreshTokenCallback,
      workspaceConnection.source_hostname!,
      data.project.id.toString()
    );

    const pullRequestBehaviour = new PullRequestBehaviour(
      E_INTEGRATION_KEYS.GITLAB,
      workspaceConnection.workspace_slug,
      gitlabService,
      planeClient,
      projectConnections || []
    );

    logger.info(`[GITLAB] Handling merge request: ${data.object_attributes.iid}`, { data });

    await pullRequestBehaviour.handleEvent({
      owner: data.project.path_with_namespace,
      repositoryName: data.project.name,
      pullRequestIdentifier: data.object_attributes.iid.toString(),
    });
  } catch (error: unknown) {
    logger.error(`[GITLAB] Error handling merge request: ${(error as Error)?.stack}`);
    throw error;
  }
};
