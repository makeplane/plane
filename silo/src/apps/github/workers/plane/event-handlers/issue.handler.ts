import { E_ENTITY_CONNECTION_KEYS, E_INTEGRATION_KEYS } from "@plane/etl/core";
import {
  createGithubService,
  GithubIssue,
  GithubService,
  transformPlaneIssue,
  WebhookGitHubUser,
} from "@plane/etl/github";
import { ExIssue, ExIssueLabel, Client as PlaneClient, PlaneWebhookPayload } from "@plane/sdk";
import { TWorkspaceCredential } from "@plane/types";
import { GithubEntityConnection, GithubWorkspaceConnection } from "@/apps/github/types";
import { env } from "@/env";
import { getConnectionDetailsForPlane } from "@/helpers/connection";
import { getPlaneAPIClient } from "@/helpers/plane-api-client";
import { getPlaneAppDetails } from "@/helpers/plane-app-details";
import { logger } from "@/logger";
import { getAPIClient } from "@/services/client";
import { TaskHeaders } from "@/types";
import { MQ, Store } from "@/worker/base";

const apiClient = getAPIClient();

export const imagePrefix = encodeURI(env.SILO_API_BASE_URL + env.SILO_BASE_PATH + "/api/assets/github/");

export const handleIssueWebhook = async (headers: TaskHeaders, mq: MQ, store: Store, payload: PlaneWebhookPayload) => {
  // Check for the key in the store, if the key is present, then the issue is already synced
  if (payload && payload.id) {
    const exist = await store.get(`silo:issue:${payload.id}`);
    if (exist) {
      logger.info("[PLANE][ISSUE] Event Processed Successfully, confirmed by target");
      // Remove the webhook from the store
      await store.del(`silo:issue:${payload.id}`);
      return true;
    }
  }

  logger.info(
    `[PLANE][${headers.type.toUpperCase()}] Received webhook event from plane for Github 🐱 --------- [${payload.event}]`
  );

  await handleIssueSync(store, payload);
};

const handleIssueSync = async (store: Store, payload: PlaneWebhookPayload) => {
  try {
    // Get the entity connection
    const { workspaceConnection, entityConnection, credentials } = await getConnectionDetailsForPlane(
      payload.workspace,
      payload.project
    );

    if (!workspaceConnection.target_hostname || !credentials.target_access_token || !credentials.source_access_token) {
      logger.error("Target hostname or target access token or source access token not found");
      return
    }

    // Get the Plane API client
    const planeClient = await getPlaneAPIClient(credentials, E_INTEGRATION_KEYS.GITHUB);

    // Create or update issue in GitHub
    const githubService = createGithubService(
      env.GITHUB_APP_ID,
      env.GITHUB_PRIVATE_KEY,
      credentials.source_access_token
    );

    const issue = await planeClient.issue.getIssue(entityConnection.workspace_slug, payload.project, payload.id);

    const labels = await planeClient.label.list(entityConnection.workspace_slug, entityConnection.project_id ?? "");
    const githubIssue = await createOrUpdateGitHubIssue(
      githubService,
      planeClient,
      issue,
      credentials,
      workspaceConnection,
      entityConnection,
      labels.results
    );

    // Update Plane issue with external_id and external_source
    if (!issue.external_id || !issue.external_source || (issue.external_source && issue.external_source !== E_INTEGRATION_KEYS.GITHUB)) {
      // Add the external id and source
      const addExternalId = async () => {
        await planeClient.issue.update(entityConnection.workspace_slug, entityConnection.project_id ?? "", payload.id, {
          external_id: githubIssue?.data.number.toString(),
          external_source: E_INTEGRATION_KEYS.GITHUB,
        });
      };

      // Create link to issue created in GitHub
      const createLink = async () => {
        const linkTitle = `[${entityConnection.entity_slug}] ${githubIssue?.data.title} #${githubIssue?.data.number}`;
        const linkUrl = githubIssue?.data.html_url;
        await planeClient.issue.createLink(entityConnection.workspace_slug, entityConnection.project_id ?? "", issue.id, linkTitle, linkUrl);
      }

      // Execute all the promises
      await Promise.all([addExternalId(), createLink()]);
    }

    // Add the issue number to the store
    await store.set(`silo:issue:${githubIssue?.data.number}`, "true");
  } catch (error) {
    logger.error("Error handling issue create/update event", error);
  }
};

const createOrUpdateGitHubIssue = async (
  githubService: GithubService,
  planeClient: PlaneClient,
  issue: ExIssue,
  credentials: TWorkspaceCredential,
  workspaceConnection: GithubWorkspaceConnection,
  entityConnection: GithubEntityConnection,
  labels: ExIssueLabel[]
) => {
  // @ts-expect-error
  const userMap: Record<string, WebhookGitHubUser> = Object.fromEntries(
    workspaceConnection.config.userMap.map((obj) => [obj.planeUser.id, obj.githubUser])
  );

  const owner = (entityConnection.entity_slug ?? "").split("/")[0];
  const repo = (entityConnection.entity_slug ?? "").split("/")[1];
  const issueImagePrefix = imagePrefix + workspaceConnection.workspace_id + "/" + credentials.user_id

  const transformedGithubIssue = await transformPlaneIssue(issue, issueImagePrefix, labels, owner, repo, userMap);

  // Find the credentials for the user
  const userCredentials = await apiClient.workspaceCredential.listWorkspaceCredentials({
    workspace_id: workspaceConnection.workspace_id,
    user_id: issue.updated_by != null ? issue.updated_by : issue.created_by,
    source: E_ENTITY_CONNECTION_KEYS.GITHUB_USER
  })

  let githubUserService = githubService;

  if (userCredentials && userCredentials.length !== 0 && userCredentials[0].source_access_token) {
    githubUserService = new GithubService({
      forUser: true,
      accessToken: userCredentials[0].source_access_token,
    });
  }

  // If the issue has already been created with the external source as GITHUB, update the issue
  if (issue.external_id && issue.external_source && issue.external_source === E_INTEGRATION_KEYS.GITHUB) {
    return githubUserService.updateIssue(Number(issue.external_id), transformedGithubIssue as GithubIssue);
  } else {
    const createdIssue = await githubUserService.createIssue(transformedGithubIssue as GithubIssue);

    const project = await planeClient.project.getProject(entityConnection.workspace_slug, entityConnection.project_id ?? "");

    const comment = `Synced Issue with [Plane](${env.APP_BASE_URL}) Workspace 🔄\n\n[${project.identifier}-${issue.sequence_id} ${issue.name}](${env.APP_BASE_URL}/${entityConnection.workspace_slug}/projects/${entityConnection.project_id}/issues/${issue.id})`;
    await githubService.createIssueComment(owner, repo, Number(createdIssue.data.number), comment);

    return createdIssue;
  }
};
