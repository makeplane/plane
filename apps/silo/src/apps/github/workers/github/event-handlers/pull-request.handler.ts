import { E_INTEGRATION_KEYS } from "@plane/etl/core";
import { EGithubEntityConnectionType, GithubPullRequestDedupPayload } from "@plane/etl/github";
import { TGithubWorkspaceConnection, TWorkspaceCredential } from "@plane/types";
import { getConnDetailsForGithubToPlaneSync } from "@/apps/github/helpers/helpers";
import { GithubIntegrationService } from "@/apps/github/services/github.service";
import { PullRequestWebhookActions } from "@/apps/github/types";
import { env } from "@/env";
import { integrationConnectionHelper } from "@/helpers/integration-connection-helper";
import { getPlaneAPIClient } from "@/helpers/plane-api-client";
import { PullRequestBehaviour } from "@/lib/behaviours";
import { logger } from "@/logger";

export const handlePullRequestEvents = async (action: PullRequestWebhookActions, data: unknown) => {
  await handlePullRequestOpened(data as unknown as GithubPullRequestDedupPayload);
  return true;
};

const handlePullRequestOpened = async (data: GithubPullRequestDedupPayload) => {
  const ghIntegrationKey = data.isEnterprise ? E_INTEGRATION_KEYS.GITHUB_ENTERPRISE : E_INTEGRATION_KEYS.GITHUB;
  const { userCredentials, wsAdminCredentials } =
    await integrationConnectionHelper.getUserAndWSAdminCredentialsWithAdminFallback(
      ghIntegrationKey,
      data.installationId.toString(),
      data.eventActorId
    );

  if (!userCredentials || !wsAdminCredentials) {
    logger.info("[PULL-REQUEST] No plane credentials found for installation id, skipping", {
      installationId: data.installationId,
      ghIntegrationKey,
    });
    return;
  }

  if (!userCredentials.target_access_token) {
    logger.info("[PULL-REQUEST] No target access token found for installation id, skipping", {
      installationId: data.installationId,
      ghIntegrationKey,
    });
    return;
  }

  // Get the workspace connection for the installation
  // get all entity connections for the installation and do pr automation on them
  const { workspaceConnection, allEntityConnections } = await getConnDetailsForGithubToPlaneSync({
    wsAdminCredentials: wsAdminCredentials as TWorkspaceCredential,
    type: EGithubEntityConnectionType.PROJECT_PR_AUTOMATION,
    isEnterprise: data.isEnterprise,
  });

  // Get the Plane API client
  const planeClient = await getPlaneAPIClient(wsAdminCredentials, ghIntegrationKey);

  // Create the pull request service based on the type of integration
  let pullRequestService: GithubIntegrationService;
  if (data.isEnterprise) {
    const appConfig = (workspaceConnection as TGithubWorkspaceConnection)?.connection_data?.appConfig;
    if (!appConfig) {
      logger.error("[PULL-REQUEST] GitHub Enterprise app config not found", {
        installationId: data.installationId,
        workspaceConnectionId: workspaceConnection.id,
        ghIntegrationKey,
      });
      return;
    }
    pullRequestService = new GithubIntegrationService({
      appId: appConfig.appId,
      privateKey: appConfig.privateKey,
      installationId: data.installationId.toString(),
      baseGithubUrl: appConfig.baseUrl,
    });
  } else {
    pullRequestService = new GithubIntegrationService({
      appId: env.GITHUB_APP_ID!,
      privateKey: env.GITHUB_PRIVATE_KEY!,
      installationId: data.installationId.toString(),
    });
  }

  // Create the pull request behaviour
  const pullRequestBehaviour = new PullRequestBehaviour(
    E_INTEGRATION_KEYS.GITHUB,
    workspaceConnection.workspace_slug,
    pullRequestService,
    planeClient,
    allEntityConnections
  );

  await pullRequestBehaviour.handleEvent({
    ...data,
    pullRequestIdentifier: data.pullRequestNumber.toString(),
  });
};
