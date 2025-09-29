import { E_INTEGRATION_ENTITY_CONNECTION_MAP } from "@plane/etl/core";
import { ContentParser, GithubService } from "@plane/etl/github";
import { logger } from "@plane/logger";
import { ExIssue, ExIssueComment, PlaneWebhookPayload } from "@plane/sdk";
import {
  E_INTEGRATION_KEYS,
  TGithubEntityConnection,
  TGithubWorkspaceConnection,
  TWorkspaceCredential,
} from "@plane/types";
import { getGithubService, getGithubUserService } from "@/apps/github/helpers";
import { getConnDetailsForPlaneToGithubSync } from "@/apps/github/helpers/helpers";
import { getPlaneAPIClient } from "@/helpers/plane-api-client";
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
  const payloadId = payload?.id ?? "";

  // Store a key associated with the data in the store
  // If the key is present, then we need to requeue all that task and process them again
  if (payloadId) {
    const exist = await store.get(`silo:comment:${payload.id}`);
    if (exist) {
      logger.info("[PLANE][COMMENT] Event Processed Successfully, confirmed by target");
      // Remove the webhook from the store
      await store.del(`silo:comment:${payload.id}`);
      return true;
    }
  }

  await handleCommentSync(store, payload);
};

const handleCommentSync = async (store: Store, payload: PlaneWebhookPayload) => {
  try {
    const ghIntegrationKey = payload.isEnterprise ? E_INTEGRATION_KEYS.GITHUB_ENTERPRISE : E_INTEGRATION_KEYS.GITHUB;
    const { workspaceConnection, entityConnection, credentials } = await getConnDetailsForPlaneToGithubSync(
      payload.workspace,
      payload.project,
      payload.isEnterprise
    );

    if (!workspaceConnection.target_hostname || !credentials.target_access_token) {
      logger.error(`${ghIntegrationKey} Target hostname or target access token not found`, {
        workspace: payload.workspace,
        project: payload.project,
        entityConnectionId: entityConnection.id,
        ghIntegrationKey,
      });
      return;
    }

    // Check if bidirectional sync is enabled
    if (!entityConnection.config.allowBidirectionalSync) {
      logger.info(`${ghIntegrationKey} Bidirectional sync is disabled, skipping issue comment sync via Plane`, {
        workspace: payload.workspace,
        project: payload.project,
        entityConnectionId: entityConnection.id,
        ghIntegrationKey,
      });
      return;
    }

    // Get the Plane API client
    const planeClient = await getPlaneAPIClient(credentials, ghIntegrationKey);

    // Get the issue associated with the comment
    const issue = await planeClient.issue.getIssue(
      entityConnection.workspace_slug,
      entityConnection.project_id ?? "",
      payload.issue
    );

    if (!issue || !issue.external_id || !issue.external_source) {
      return logger.info(`${ghIntegrationKey} Issue ${payload.issue} not synced with GitHub, aborting comment sync`, {
        workspace: payload.workspace,
        project: payload.project,
        entityConnectionId: entityConnection.id,
        ghIntegrationKey,
      });
    }

    if (!credentials.source_access_token) {
      logger.error(`${ghIntegrationKey} Source access token not found`, {
        workspace: payload.workspace,
        project: payload.project,
        entityConnectionId: entityConnection.id,
        ghIntegrationKey,
      });
      return;
    }

    const githubService = getGithubService(
      workspaceConnection as TGithubWorkspaceConnection,
      credentials.source_access_token,
      payload.isEnterprise
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
      credentials,
      ghIntegrationKey
    );
    await store.set(`silo:comment:${githubComment.data.id}`, "true");

    if (
      !comment.external_id ||
      !comment.external_source ||
      (comment.external_source && comment.external_source !== ghIntegrationKey)
    ) {
      await planeClient.issueComment.update(
        entityConnection.workspace_slug,
        entityConnection.project_id ?? "",
        payload.issue,
        payload.id,
        {
          external_id: githubComment.data.id.toString(),
          external_source: ghIntegrationKey,
        }
      );
    }
  } catch (error) {
    logger.error("[Plane][Github] Error handling issue comment create/update event", {
      error,
      workspace: payload.workspace,
      project: payload.project,
    });
  }
};

const createOrUpdateGitHubComment = async (
  githubService: GithubService,
  issue: ExIssue,
  comment: ExIssueComment,
  workspaceConnection: TGithubWorkspaceConnection,
  entityConnection: TGithubEntityConnection,
  credentials: TWorkspaceCredential,
  ghIntegrationKey: E_INTEGRATION_KEYS
) => {
  const owner = (entityConnection.entity_slug ?? "").split("/")[0];
  const repo = (entityConnection.entity_slug ?? "").split("/")[1];
  const isEnterprise = ghIntegrationKey === E_INTEGRATION_KEYS.GITHUB_ENTERPRISE;

  const assetImagePrefix = imagePrefix + workspaceConnection.workspace_id + "/" + credentials.user_id;

  const htmlToRemove = /Comment (updated|created) on GitHub By \[(.*?)\]\((.*?)\)/gim;
  const cleanHtml = comment.comment_html.replace(htmlToRemove, "");
  const markdown = ContentParser.toMarkdown(cleanHtml, assetImagePrefix);

  // Find the credentials for the comment creator
  const [userCredential] = await apiClient.workspaceCredential.listWorkspaceCredentials({
    source: E_INTEGRATION_ENTITY_CONNECTION_MAP[ghIntegrationKey],
    workspace_id: entityConnection.workspace_id,
    user_id: comment.updated_by || comment.created_by,
  });

  let userGithubService = githubService;

  if (userCredential?.source_access_token) {
    userGithubService = getGithubUserService(
      workspaceConnection as TGithubWorkspaceConnection,
      userCredential.source_access_token,
      isEnterprise
    );
  }

  if (comment.external_id && comment.external_source && comment.external_source === ghIntegrationKey) {
    logger.info("Comment already exists in GitHub, updating the comment", { commentId: comment.id, ghIntegrationKey });
    return userGithubService.updateIssueComment(owner, repo, Number(comment.external_id), markdown);
  } else {
    return userGithubService.createIssueComment(owner, repo, Number(issue.external_id), markdown);
  }
};
