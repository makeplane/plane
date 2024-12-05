import { MQ, Store } from "@/apps/engine/worker/base";
import { GithubEntityConnection } from "@/apps/github/types";
import { getCredentialsByWorkspaceId } from "@/db/query";
import { env } from "@/env";
import { getConnectionDetailsForPlane } from "@/helpers/connection";
import { logger } from "@/logger";
import { TaskHeaders } from "@/types";
import { ExIssue, ExIssueComment, Client as PlaneClient, PlaneWebhookPayload } from "@plane/sdk";
import { createGithubService, GithubService } from "@silo/github";

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

    const planeClient = new PlaneClient({
      baseURL: workspaceConnection.targetHostname,
      apiToken: credentials.target_access_token,
    });

    // Get the issue associated with the comment
    const issue = await planeClient.issue.getIssue(
      entityConnection.workspaceSlug,
      entityConnection.projectId,
      payload.issue
    );

    if (!issue || !issue.external_id || !issue.external_source) {
      return logger.info(`Issue ${payload.issue} not synced with GitHub, aborting comment sync`);
    }

    const githubService = createGithubService(
      env.GITHUB_APP_ID,
      env.GITHUB_PRIVATE_KEY,
      credentials.source_access_token
    );

    const comment = await planeClient.issueComment.getComment(
      entityConnection.workspaceSlug,
      entityConnection.projectId,
      payload.issue,
      payload.id
    );

    const githubComment = await createOrUpdateGitHubComment(githubService, issue, comment, entityConnection);
    await store.set(`silo:comment:${githubComment.data.id}`, "true");

    if (!comment.external_id || !comment.external_source) {
      await planeClient.issueComment.update(
        entityConnection.workspaceSlug,
        entityConnection.projectId,
        payload.issue,
        payload.id,
        {
          external_id: githubComment.data.id.toString(),
          external_source: "GITHUB",
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
  entityConnection: GithubEntityConnection
) => {
  const owner = entityConnection.entitySlug.split("/")[0];
  const repo = entityConnection.entitySlug.split("/")[1];

  const htmlToRemove = /<p>Comment (created|updated) on GitHub By <a.*?>.*?<\/a><\/p>$/gm;
  const cleanHtml = comment.comment_html.replace(htmlToRemove, "");

  // Find the credentials for the comment creator
  const userCredentials = await getCredentialsByWorkspaceId(
    entityConnection.workspaceId,
    comment.created_by,
    "GITHUB-USER"
  );

  let userGithubService = githubService;

  if (userCredentials && userCredentials.length !== 0 && userCredentials[0].source_access_token) {
    userGithubService = new GithubService({
      forUser: true,
      accessToken: userCredentials[0].source_access_token,
    });
  }

  if (comment.external_id && comment.external_source === "GITHUB") {
    return userGithubService.updateIssueComment(owner, repo, Number(comment.external_id), cleanHtml);
  } else {
    return userGithubService.createIssueComment(owner, repo, Number(issue.external_id), cleanHtml);
  }
};
