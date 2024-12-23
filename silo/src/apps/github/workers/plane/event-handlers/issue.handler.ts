import { MQ, Store } from "@/apps/engine/worker/base";
import { GithubEntityConnection, GithubWorkspaceConnection } from "@/apps/github/types";
import { getCredentialsByWorkspaceId } from "@/db/query";
import { env } from "@/env";
import { getConnectionDetailsForPlane } from "@/helpers/connection";
import { logger } from "@/logger";
import { TaskHeaders } from "@/types";
import { ExIssue, ExIssueLabel, Client as PlaneClient, PlaneWebhookPayload } from "@plane/sdk";
import { TServiceCredentials } from "@plane/etl/core";
import {
  createGithubService,
  GithubIssue,
  GithubService,
  transformPlaneIssue,
  WebhookGitHubUser,
} from "@plane/etl/github";

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

    const planeClient = new PlaneClient({
      baseURL: workspaceConnection.targetHostname,
      apiToken: credentials.target_access_token,
    });

    // Create or update issue in GitHub
    const githubService = createGithubService(
      env.GITHUB_APP_ID,
      env.GITHUB_PRIVATE_KEY,
      credentials.source_access_token
    );

    const issue = await planeClient.issue.getIssue(entityConnection.workspaceSlug, payload.project, payload.id);

    const labels = await planeClient.label.list(entityConnection.workspaceSlug, entityConnection.projectId);
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
    if (!issue.external_id || !issue.external_source || (issue.external_source && issue.external_source !== "GITHUB")) {
      // Add the external id and source
      const addExternalId = async () => {
        await planeClient.issue.update(entityConnection.workspaceSlug, entityConnection.projectId, payload.id, {
          external_id: githubIssue?.data.number.toString(),
          external_source: "GITHUB",
        });
      };

      // Create link to issue created in GitHub
      const createLink = async () => {
        const linkTitle = `[${entityConnection.entitySlug}] ${githubIssue?.data.title} #${githubIssue?.data.number}`;
        const linkUrl = githubIssue?.data.html_url;
        await planeClient.issue.createLink(
          entityConnection.workspaceSlug,
          entityConnection.projectId,
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
    logger.error("Error handling issue create/update event", error);
    console.log(error);
  }
};

const createOrUpdateGitHubIssue = async (
  githubService: GithubService,
  planeClient: Client,
  issue: ExIssue,
  credentials: TServiceCredentials,
  workspaceConnection: GithubWorkspaceConnection,
  entityConnection: GithubEntityConnection,
  labels: ExIssueLabel[]
) => {
  // @ts-ignore
  const userMap: Record<string, WebhookGitHubUser> = Object.fromEntries(
    workspaceConnection.config.userMap.map((obj) => [obj.planeUser.id, obj.githubUser])
  );

  const owner = entityConnection.entitySlug.split("/")[0];
  const repo = entityConnection.entitySlug.split("/")[1];
  const issueImagePrefix = imagePrefix + workspaceConnection.workspaceId + "/" + credentials.user_id;

  const transformedGithubIssue = await transformPlaneIssue(issue, issueImagePrefix, labels, owner, repo, userMap);

  // Find the credentials for the user
  const userCredentials = await getCredentialsByWorkspaceId(
    workspaceConnection.workspaceId,
    issue.updated_by != null ? issue.updated_by : issue.created_by,
    "GITHUB-USER"
  );

  let githubUserService = githubService;

  if (userCredentials && userCredentials.length !== 0 && userCredentials[0].source_access_token) {
    githubUserService = new GithubService({
      forUser: true,
      accessToken: userCredentials[0].source_access_token,
    });
  }

  // If the issue has already been created with the external source as GITHUB, update the issue
  if (issue.external_id && issue.external_source && issue.external_source === "GITHUB") {
    return githubUserService.updateIssue(Number(issue.external_id), transformedGithubIssue as GithubIssue);
  } else {
    const createdIssue = await githubUserService.createIssue(transformedGithubIssue as GithubIssue);

    const project = await planeClient.project.getProject(entityConnection.workspaceSlug, entityConnection.projectId);

    const comment = `Synced Issue with [Plane](${env.APP_BASE_URL}) Workspace 🔄\n\n[${project.identifier}-${issue.sequence_id} ${issue.name}](${env.APP_BASE_URL}/${entityConnection.workspaceSlug}/projects/${entityConnection.projectId}/issues/${issue.id})`;
    await githubService.createIssueComment(owner, repo, Number(createdIssue.data.number), comment);

    return createdIssue;
  }
};
