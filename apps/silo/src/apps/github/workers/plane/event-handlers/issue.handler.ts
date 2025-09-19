import { E_INTEGRATION_ENTITY_CONNECTION_MAP, E_INTEGRATION_KEYS } from "@plane/etl/core";
import { GithubIssue, GithubService, transformPlaneIssue, WebhookGitHubUser } from "@plane/etl/github";
import { ExIssue, ExIssueLabel, Client as PlaneClient, PlaneWebhookPayload } from "@plane/sdk";
import { TGithubEntityConnection, TGithubWorkspaceConnection, TWorkspaceCredential } from "@plane/types";
import { getGithubService, getGithubUserService } from "@/apps/github/helpers";
import { getConnDetailsForPlaneToGithubSync } from "@/apps/github/helpers/helpers";
import { env } from "@/env";
import { getPlaneAPIClient } from "@/helpers/plane-api-client";
import { getIssueUrlFromSequenceId } from "@/helpers/urls";
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
    const ghIntegrationKey = payload.isEnterprise ? E_INTEGRATION_KEYS.GITHUB_ENTERPRISE : E_INTEGRATION_KEYS.GITHUB;
    // Get the entity connection
    const { workspaceConnection, entityConnection, credentials } = await getConnDetailsForPlaneToGithubSync(
      payload.workspace,
      payload.project,
      payload.isEnterprise
    );

    if (!workspaceConnection.target_hostname || !credentials.target_access_token || !credentials.source_access_token) {
      logger.error("Target hostname or target access token or source access token not found", {
        workspace: payload.workspace,
        project: payload.project,
        entityConnectionId: entityConnection.id,
        ghIntegrationKey,
      });
      return;
    }

    // Check if bidirectional sync is enabled
    if (!entityConnection.config.allowBidirectionalSync) {
      logger.info("Bidirectional sync is disabled, skipping issue sync via Plane", {
        workspace: payload.workspace,
        project: payload.project,
        entityConnectionId: entityConnection.id,
        ghIntegrationKey,
      });
      return;
    }

    // Get the Plane API client
    const planeClient = await getPlaneAPIClient(credentials, ghIntegrationKey);

    // Create or update issue in GitHub
    const githubService = getGithubService(
      workspaceConnection as TGithubWorkspaceConnection,
      credentials.source_access_token,
      payload.isEnterprise
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
      labels.results,
      ghIntegrationKey
    );

    // Update Plane issue with external_id and external_source
    if (
      !issue.external_id ||
      !issue.external_source ||
      (issue.external_source && issue.external_source !== ghIntegrationKey)
    ) {
      // Add the external id and source
      const addExternalId = async () => {
        await planeClient.issue.update(entityConnection.workspace_slug, entityConnection.project_id ?? "", payload.id, {
          external_id: githubIssue?.data.number.toString(),
          external_source: ghIntegrationKey,
        });
      };

      // Create link to issue created in GitHub
      const createLink = async () => {
        const linkTitle = `[${entityConnection.entity_slug}] ${githubIssue?.data.title} #${githubIssue?.data.number}`;
        const linkUrl = githubIssue?.data.html_url;
        await planeClient.issue.createLink(
          entityConnection.workspace_slug,
          entityConnection.project_id ?? "",
          issue.id,
          linkTitle,
          linkUrl
        );
      };

      // Execute all the promises
      await Promise.all([addExternalId(), createLink()]);
    }

    // Add the issue number to the store
    await store.set(`silo:issue:${githubIssue?.data.number}`, "true");
  } catch (error) {
    logger.error("[Plane][Github] Error handling issue create/update event", {
      error: error,
      workspace: payload.workspace,
      project: payload.project,
    });
  }
};

const createOrUpdateGitHubIssue = async (
  githubService: GithubService,
  planeClient: PlaneClient,
  issue: ExIssue,
  credentials: TWorkspaceCredential,
  workspaceConnection: TGithubWorkspaceConnection,
  entityConnection: TGithubEntityConnection,
  labels: ExIssueLabel[],
  ghIntegrationKey: E_INTEGRATION_KEYS
) => {
  const isEnterprise = ghIntegrationKey === E_INTEGRATION_KEYS.GITHUB_ENTERPRISE;
  // @ts-expect-error
  const userMap: Record<string, WebhookGitHubUser> = Object.fromEntries(
    workspaceConnection.config.userMap.map((obj) => [obj.planeUser.id, obj.githubUser])
  );

  const owner = (entityConnection.entity_slug ?? "").split("/")[0];
  const repo = (entityConnection.entity_slug ?? "").split("/")[1];
  const issueImagePrefix = imagePrefix + workspaceConnection.workspace_id + "/" + credentials.user_id;
  const issueStateMap = entityConnection.config.states?.issueEventMapping;
  const transformedGithubIssue = await transformPlaneIssue(
    issue,
    issueImagePrefix,
    labels,
    owner,
    repo,
    userMap,
    issueStateMap,
    planeClient,
    entityConnection.workspace_slug,
    entityConnection.project_id ?? ""
  );

  // Find the credentials for the user
  const [userCredential] = await apiClient.workspaceCredential.listWorkspaceCredentials({
    workspace_id: workspaceConnection.workspace_id,
    user_id: issue.updated_by != null ? issue.updated_by : issue.created_by,
    source: E_INTEGRATION_ENTITY_CONNECTION_MAP[ghIntegrationKey],
  });

  let githubUserService = githubService;

  // If the user has a credential, create a new github service for the user
  if (userCredential?.source_access_token) {
    githubUserService = getGithubUserService(
      workspaceConnection as TGithubWorkspaceConnection,
      userCredential.source_access_token,
      isEnterprise
    );
  }

  // If the issue has already been created with the external source as GITHUB, update the issue
  if (issue.external_id && issue.external_source && issue.external_source === ghIntegrationKey) {
    logger.info("Issue already exists in GitHub, updating the issue", { issueId: issue.id, ghIntegrationKey });
    return githubUserService.updateIssue(Number(issue.external_id), transformedGithubIssue as GithubIssue);
  } else {
    const createdIssue = await githubUserService.createIssue(transformedGithubIssue as GithubIssue);

    const project = await planeClient.project.getProject(
      entityConnection.workspace_slug,
      entityConnection.project_id ?? ""
    );

    const issueUrl = getIssueUrlFromSequenceId(
      entityConnection.workspace_slug,
      project.identifier ?? "",
      issue.sequence_id.toString()
    );
    const comment = `Synced with [Plane](${env.APP_BASE_URL}) Workspace 🔄\n\n[[${project.identifier}-${issue.sequence_id}] ${issue.name}](${issueUrl})`;
    await githubService.createIssueComment(owner, repo, Number(createdIssue.data.number), comment);

    return createdIssue;
  }
};
