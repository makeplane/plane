import { E_INTEGRATION_KEYS, TServiceCredentials } from "@plane/etl/core";
import { GithubPullRequestDedupPayload } from "@plane/etl/github";
import { Client as PlaneClient } from "@plane/sdk";
import { getConnectionDetails } from "@/apps/github/helpers/helpers";
import { GithubIntegrationService } from "@/apps/github/services/github.service";
import {
  PullRequestWebhookActions
} from "@/apps/github/types";
import { env } from "@/env";
import { PullRequestBehaviour } from "@/lib/behaviours";
import { logger } from "@/logger";
import { getAPIClient } from "@/services/client";

const apiClient = getAPIClient();

export const handlePullRequestEvents = async (action: PullRequestWebhookActions, data: unknown) => {
  await handlePullRequestOpened(data as unknown as GithubPullRequestDedupPayload);
  return true;
};

const handlePullRequestOpened = async (data: GithubPullRequestDedupPayload) => {
  const credentials = await apiClient.workspaceCredential.listWorkspaceCredentials({
    source: E_INTEGRATION_KEYS.GITHUB,
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

  const { workspaceConnection, entityConnection } = await getConnectionDetails({
    accountId: accountId.toString(),
    credentials: planeCredentials as TServiceCredentials,
    installationId: data.installationId.toString(),
    repositoryId: data.repositoryId.toString(),
  });

  const planeClient = new PlaneClient({
    baseURL: env.API_BASE_URL,
    apiToken: planeCredentials.target_access_token,
  });

  const pullRequestBehaviour = new PullRequestBehaviour(
    E_INTEGRATION_KEYS.GITHUB,
    workspaceConnection.workspace_slug,
    new GithubIntegrationService({
      appId: env.GITHUB_APP_ID!,
      privateKey: env.GITHUB_PRIVATE_KEY!,
      installationId: data.installationId.toString(),
    }),
    planeClient,
    entityConnection?.config || {}
  );

  await pullRequestBehaviour.handleEvent({
    ...data,
    pullRequestIdentifier: data.pullRequestNumber.toString(),
  });
};
