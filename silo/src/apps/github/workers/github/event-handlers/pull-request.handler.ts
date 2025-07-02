import { E_INTEGRATION_KEYS, TServiceCredentials } from "@plane/etl/core";
import { GithubPullRequestDedupPayload } from "@plane/etl/github";
import { TGithubWorkspaceConnection } from "@plane/types";
import { getConnectionDetails } from "@/apps/github/helpers/helpers";
import { GithubIntegrationService } from "@/apps/github/services/github.service";
import { PullRequestWebhookActions } from "@/apps/github/types";
import { env } from "@/env";
import { getPlaneAPIClient } from "@/helpers/plane-api-client";
import { getPlaneAppDetails } from "@/helpers/plane-app-details";
import { PullRequestBehaviour } from "@/lib/behaviours";
import { logger } from "@/logger";
import { getAPIClient } from "@/services/client";

const apiClient = getAPIClient();

export const handlePullRequestEvents = async (action: PullRequestWebhookActions, data: unknown) => {
  await handlePullRequestOpened(data as unknown as GithubPullRequestDedupPayload);
  return true;
};

const handlePullRequestOpened = async (data: GithubPullRequestDedupPayload) => {
  const ghIntegrationKey = data.isEnterprise ? E_INTEGRATION_KEYS.GITHUB_ENTERPRISE : E_INTEGRATION_KEYS.GITHUB;
  const credentials = await apiClient.workspaceCredential.listWorkspaceCredentials({
    source: ghIntegrationKey,
    source_access_token: data.installationId.toString(),
  });

  if (!credentials || credentials.length !== 1) {
    if (credentials.length === 0) {
      logger.info("No credentials found for installation id", data.installationId);
      return false;
    }
    throw new Error(`Invalid credential set found for installation id ${data.installationId}`);
  }

  const planeCredentials = credentials[0];

  if (!planeCredentials.target_access_token) {
    logger.info("No target access token found for installation id", data.installationId);
    return false;
  }

  // Get the workspace connection for the installation
  const accountId = data.accountId;

  const { workspaceConnection, allEntityConnectionsForRepository } = await getConnectionDetails({
    accountId: accountId.toString(),
    credentials: planeCredentials as TServiceCredentials,
    installationId: data.installationId.toString(),
    repositoryId: data.repositoryId.toString(),
    isEnterprise: data.isEnterprise,
  });

  // Get the Plane API client
  const planeClient = await getPlaneAPIClient(planeCredentials, ghIntegrationKey);

  // Create the pull request service based on the type of integration
  let pullRequestService: GithubIntegrationService;
  if (data.isEnterprise) {
    const appConfig = (workspaceConnection as TGithubWorkspaceConnection)?.connection_data?.appConfig;
    if (!appConfig) {
      throw new Error("GitHub Enterprise app config not found");
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
    allEntityConnectionsForRepository
  );

  await pullRequestBehaviour.handleEvent({
    ...data,
    pullRequestIdentifier: data.pullRequestNumber.toString(),
  });
};
