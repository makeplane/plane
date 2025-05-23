import { E_ENTITY_CONNECTION_KEYS, E_INTEGRATION_KEYS } from "@plane/etl/core";
import { createGithubService, GithubService, ContentParser } from "@plane/etl/github";
import { ExIssue, ExIssueComment, PlaneWebhookPayload } from "@plane/sdk";
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
import { imagePrefix } from "./issue.handler";

const apiClient = getAPIClient();

export const handleIssueCommentWebhook = async (
  headers: TaskHeaders,
  mq: MQ,
  store: Store,
  payload: PlaneWebhookPayload
) => {
  // Store a key associated with the data in the store
  // If the key is present, then we need to requeue all that task and process them again
  if (payload && payload && payload.id) {
    // @ts-ignore
    const exist = await store.get(`silo:comment:${payload.id}`);
    if (exist) {
      logger.info("[PLANE][COMMENT] Event Processed Successfully, confirmed by target");
      // Remove the webhook from the store
      // @ts-ignore
      await store.del(`silo:comment:${payload.id}`);
      return true;
    }
  }

  await handleCommentSync(store, payload);
};

const handleCommentSync = async (store: Store, payload: PlaneWebhookPayload) => {
  try {
    const { workspaceConnection, entityConnection, credentials } = await getConnectionDetailsForPlane(
      payload.workspace,
      payload.project
    );

    if(!workspaceConnection.target_hostname || !credentials.target_access_token) {
      logger.error("Target hostname or target access token not found");
      return
    }

    // Get the Plane API client
    const planeClient = await getPlaneAPIClient(credentials, E_INTEGRATION_KEYS.GITHUB);

    // Get the issue associated with the comment
    const issue = await planeClient.issue.getIssue(
      entityConnection.workspace_slug,
      entityConnection.project_id ?? "",
      payload.issue
    );

    if (!issue || !issue.external_id || !issue.external_source) {
      return logger.info(`Issue ${payload.issue} not synced with GitHub, aborting comment sync`);
    }

    if(!credentials.source_access_token) {
      logger.error("Source access token not found");
      return;
    }

    const githubService = createGithubService(
      env.GITHUB_APP_ID,
      env.GITHUB_PRIVATE_KEY,
      credentials.source_access_token
    );

    const comment = await planeClient.issueComment.getComment(
      entityConnection.workspace_slug,
      entityConnection.project_id ?? "",
      payload.issue,
      payload.id
    );

    const githubComment = await createOrUpdateGitHubComment(
      githubService,
      issue,
      comment,
      workspaceConnection,
      entityConnection,
      credentials
    );
    await store.set(`silo:comment:${githubComment.data.id}`, "true");

    if (
      !comment.external_id ||
      !comment.external_source ||
      (comment.external_source && comment.external_source !== E_INTEGRATION_KEYS.GITHUB)
    ) {
      await planeClient.issueComment.update(
        entityConnection.workspace_slug,
        entityConnection.project_id ?? "",
        payload.issue,
        payload.id,
        {
          external_id: githubComment.data.id.toString(),
          external_source: E_INTEGRATION_KEYS.GITHUB,
        }
      );
    }
  } catch (error) {
    logger.error("Error handling comment create/update event", error);
  }
};

const createOrUpdateGitHubComment = async (
  githubService: GithubService,
  issue: ExIssue,
  comment: ExIssueComment,
  workspaceConnection: GithubWorkspaceConnection,
  entityConnection: GithubEntityConnection,
  credentials: TWorkspaceCredential
) => {
  const owner = (entityConnection.entity_slug ?? "").split("/")[0];
  const repo = (entityConnection.entity_slug ?? "").split("/")[1];

  const assetImagePrefix = imagePrefix + workspaceConnection.workspace_id + "/" + credentials.user_id;

  const htmlToRemove = /Comment (updated|created) on GitHub By \[(.*?)\]\((.*?)\)/gim;
  const cleanHtml = comment.comment_html.replace(htmlToRemove, "");
  const markdown = ContentParser.toMarkdown(cleanHtml, assetImagePrefix);

  // Find the credentials for the comment creator
  const userCredentials = await apiClient.workspaceCredential.listWorkspaceCredentials({
    source: E_ENTITY_CONNECTION_KEYS.GITHUB_USER,
    workspace_id: entityConnection.workspace_id,
    user_id: comment.updated_by || comment.created_by,
  });

  let userGithubService = githubService;

  if (userCredentials && userCredentials.length !== 0 && userCredentials[0].source_access_token) {
    userGithubService = new GithubService({
      forUser: true,
      accessToken: userCredentials[0].source_access_token,
    });
  }

  if (comment.external_id && comment.external_source && comment.external_source === E_INTEGRATION_KEYS.GITHUB) {
    return userGithubService.updateIssueComment(owner, repo, Number(comment.external_id), markdown);
  } else {
    return userGithubService.createIssueComment(owner, repo, Number(issue.external_id), markdown);
  }
};
