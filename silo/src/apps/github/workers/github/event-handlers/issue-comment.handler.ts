import { Store } from "@/apps/engine/worker/base";
import { getConnectionDetails } from "@/apps/github/helpers/helpers";
import { GithubEntityConnection } from "@/apps/github/types";
import { logger } from "@/logger";
import { TServiceCredentials } from "@plane/etl/core";
import {
  createGithubService,
  GithubService,
  GithubWebhookPayload,
  transformGitHubComment,
  WebhookGitHubComment,
} from "@plane/etl/github";
import { ExIssueComment, Client as PlaneClient } from "@plane/sdk";

import { shouldSync } from "./issue.handler";
import { getCredentialsForTargetToken } from "@/helpers/credential";
import { env } from "@/env";

export type GithubCommentAction = "created" | "edited" | "deleted";

export const handleIssueComment = async (store: Store, action: GithubCommentAction, data: unknown) => {
  // @ts-ignore
  if (data && data.comment && data.comment.id) {
    // @ts-ignore
    const exist = await store.get(`silo:comment:${data.comment.id}`);
    if (exist) {
      logger.info("[GITHUB][COMMENT] Event Processed Successfully, confirmed by target");
      // Remove the webhook from the store
      // @ts-ignore
      await store.del(`silo:comment:${data.comment.id}`);
      return true;
    }
  }

  await syncCommentWithPlane(
    store,
    action,
    data as GithubWebhookPayload["webhook-issue-comment-created" | "webhook-issue-comment-edited"]
  );

  return true;
};

export const syncCommentWithPlane = async (
  store: Store,
  action: GithubCommentAction,
  data: GithubWebhookPayload["webhook-issue-comment-created" | "webhook-issue-comment-edited"]
) => {
  try {
    if (!data.installation || !shouldSync(data.issue.labels) || data.comment.user?.type !== "User") {
      return;
    }

    const planeCredentials = await getCredentialsForTargetToken(data.installation.id.toString());
    const accountId = data.organization ? data.organization.id : data.repository.owner.id;

    const { workspaceConnection, entityConnection } = await getConnectionDetails({
      accountId: accountId.toString(),
      credentials: planeCredentials as TServiceCredentials,
      installationId: data.installation.id.toString(),
      repositoryId: data.repository.id.toString(),
    });

    const planeClient = new PlaneClient({
      apiToken: planeCredentials.target_access_token!,
      baseURL: workspaceConnection.targetHostname,
    });

    const ghService = createGithubService(env.GITHUB_APP_ID, env.GITHUB_PRIVATE_KEY, data.installation.id.toString());
    const commentHtml = await ghService.getCommentHtml(
      data.repository.owner.login,
      data.repository.name,
      data.issue.number.toString(),
      data.comment.id
    );

    const issue = await getPlaneIssue(planeClient, entityConnection, data.issue.number.toString());

    const userMap: Record<string, string> = Object.fromEntries(
      workspaceConnection.config.userMap.map((obj) => [obj.githubUser.login, obj.planeUser.id])
    );

    const planeUsers = await planeClient.users.list(entityConnection.workspaceSlug, entityConnection.projectId);

    let comment: ExIssueComment | null = null;

    try {
      comment = await planeClient.issueComment.getIssueCommentWithExternalId(
        entityConnection.workspaceSlug,
        entityConnection.projectId,
        issue.id,
        data.comment.id.toString(),
        "GITHUB"
      );
    } catch (error) {}

    const planeComment = await transformGitHubComment(
      data.comment as unknown as WebhookGitHubComment,
      commentHtml ?? "<p></p>",
      encodeURI(env.SILO_API_BASE_URL + env.SILO_BASE_PATH + "/api/assets/github"),
      issue.id,
      data.repository.full_name,
      entityConnection.workspaceSlug,
      entityConnection.projectId,
      planeClient,
      ghService,
      userMap,
      planeUsers,
      comment ? true : false
    );

    if (comment) {
      await planeClient.issueComment.update(
        entityConnection.workspaceSlug,
        entityConnection.projectId,
        issue.id,
        comment.id,
        planeComment
      );
      await store.set(`silo:comment:${comment.id}`, "true");
    } else {
      const createdComment = await planeClient.issueComment.create(
        entityConnection.workspaceSlug,
        entityConnection.projectId,
        issue.id,
        planeComment
      );
      await store.set(`silo:comment:${createdComment.id}`, "true");
    }
  } catch (error) {
    logger.error("Error syncing comment with Plane");
    console.log(error);
  }
};

const getPlaneIssue = async (planeClient: PlaneClient, entityConnection: GithubEntityConnection, issueId: string) => {
  try {
    return await planeClient.issue.getIssueWithExternalId(
      entityConnection.workspaceSlug,
      entityConnection.projectId,
      issueId.toString(),
      "GITHUB"
    );
  } catch {
    throw new Error("Issue not found in Plane");
  }
};
