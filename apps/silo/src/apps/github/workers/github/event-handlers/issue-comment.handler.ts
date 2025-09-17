import { E_INTEGRATION_KEYS } from "@plane/etl/core";
import {
  EGithubEntityConnectionType,
  GithubWebhookPayload,
  transformGitHubComment,
  WebhookGitHubComment,
} from "@plane/etl/github";
import { ExIssueComment, Client as PlaneClient } from "@plane/sdk";
import { TGithubEntityConnection, TGithubWorkspaceConnection, TWorkspaceCredential } from "@plane/types";
import { getGithubService } from "@/apps/github/helpers";
import { getConnDetailsForGithubToPlaneSync } from "@/apps/github/helpers/helpers";

import { env } from "@/env";
import { integrationConnectionHelper } from "@/helpers/integration-connection-helper";
import { getPlaneAPIClient } from "@/helpers/plane-api-client";
import { logger } from "@/logger";
import { Store } from "@/worker/base";
import { shouldSync } from "./issue.handler";

export type GithubCommentAction = "created" | "edited" | "deleted";

export type GithubCommentWebhookPayload = GithubWebhookPayload[
  | "webhook-issue-comment-created"
  | "webhook-issue-comment-edited"] & {
  isEnterprise: boolean;
};

export const handleIssueComment = async (store: Store, action: GithubCommentAction, data: unknown) => {
  // @ts-expect-error
  if (data && data.comment && data.comment.id) {
    // @ts-expect-error
    const exist = await store.get(`silo:comment:${data.comment.id}`);
    if (exist) {
      logger.info(`[ISSUE-COMMENT] Event Processed Successfully, confirmed by target`);
      // Remove the webhook from the store
      // @ts-expect-error
      await store.del(`silo:comment:${data.comment.id}`);
      return true;
    }
  }

  await syncCommentWithPlane(store, action, data as GithubCommentWebhookPayload);

  return true;
};

export const syncCommentWithPlane = async (
  store: Store,
  action: GithubCommentAction,
  data: GithubCommentWebhookPayload
) => {
  const ghIntegrationKey = data.isEnterprise ? E_INTEGRATION_KEYS.GITHUB_ENTERPRISE : E_INTEGRATION_KEYS.GITHUB;
  if (!data.installation || !shouldSync(data.issue.labels) || data.comment.user?.type !== "User") {
    logger.info(
      `${ghIntegrationKey}[COMMENT] No installation or should sync or comment user type is not user, skipping`,
      { repositoryId: data.repository.id, ghIntegrationKey }
    );
    return;
  }
  const { userCredentials, wsAdminCredentials } =
    await integrationConnectionHelper.getUserAndWSAdminCredentialsWithAdminFallback(
      ghIntegrationKey,
      data.installation.id.toString(),
      data.sender.id.toString()
    );

  if (!userCredentials || !wsAdminCredentials) {
    logger.info(`${ghIntegrationKey}[ISSUE-COMMENT] No plane credentials found, skipping`, {
      installationId: data.installation.id,
      repositoryId: data.repository.id,
    });
    return;
  }

  const { workspaceConnection, entityConnectionForRepository: entityConnection } =
    await getConnDetailsForGithubToPlaneSync({
      wsAdminCredentials: wsAdminCredentials as TWorkspaceCredential,
      type: EGithubEntityConnectionType.PROJECT_ISSUE_SYNC,
      repositoryId: data.repository.id.toString(),
      isEnterprise: data.isEnterprise,
    });

  if (!workspaceConnection.target_hostname) {
    throw new Error("Target hostname not found");
  }

  if (!entityConnection) {
    logger.info(`${ghIntegrationKey}[ISSUE-COMMENT] No entity connection found, skipping`, {
      repositoryId: data.repository.id,
      ghIntegrationKey,
    });
    return;
  }

  const planeClient = await getPlaneAPIClient(userCredentials, ghIntegrationKey);

  const ghService = getGithubService(
    workspaceConnection as TGithubWorkspaceConnection,
    data.installation?.id.toString(),
    data.isEnterprise
  );
  const commentHtml = await ghService.getCommentHtml(
    data.repository.owner.login,
    data.repository.name,
    data.issue.number.toString(),
    data.comment.id
  );

  const issue = await getPlaneIssue(planeClient, entityConnection, data.issue.number.toString(), ghIntegrationKey);

  if (!issue) {
    logger.error(`${ghIntegrationKey}[ISSUE-COMMENT] Issue not found in Plane, skipping`, {
      workspace: workspaceConnection.workspace_slug,
      project: entityConnection.project_id ?? "",
      repositoryId: data.repository.id,
      ghIntegrationKey,
      issueId: data.issue.number.toString(),
    });
    return;
  }

  const userMap: Record<string, string> = Object.fromEntries(
    workspaceConnection.config.userMap.map((obj: any) => [obj.githubUser.login, obj.planeUser.id])
  );

  const planeUsers = await planeClient.users.list(
    workspaceConnection.workspace_slug,
    entityConnection.project_id ?? ""
  );

  let comment: ExIssueComment | null = null;

  try {
    comment = await planeClient.issueComment.getIssueCommentWithExternalId(
      workspaceConnection.workspace_slug,
      entityConnection.project_id ?? "",
      issue.id,
      data.comment.id.toString(),
      ghIntegrationKey
    );
  } catch (error) {}

  const planeComment = await transformGitHubComment(
    data.comment as unknown as WebhookGitHubComment,
    commentHtml ?? "<p></p>",
    encodeURI(env.SILO_API_BASE_URL + env.SILO_BASE_PATH + `/api/assets/${ghIntegrationKey.toLowerCase()}`),
    issue.id,
    data.repository.full_name,
    workspaceConnection.workspace_slug,
    entityConnection.project_id ?? "",
    planeClient,
    ghService,
    userMap,
    planeUsers,
    comment ? true : false
  );

  if (comment) {
    await planeClient.issueComment.update(
      workspaceConnection.workspace_slug,
      entityConnection.project_id ?? "",
      issue.id,
      comment.id,
      planeComment
    );
    await store.set(`silo:comment:${comment.id}`, "true");
  } else {
    const createdComment = await planeClient.issueComment.create(
      workspaceConnection.workspace_slug,
      entityConnection.project_id ?? "",
      issue.id,
      planeComment
    );
    await store.set(`silo:comment:${createdComment.id}`, "true");
  }
};

const getPlaneIssue = async (
  planeClient: PlaneClient,
  entityConnection: TGithubEntityConnection,
  issueId: string,
  ghIntegrationKey: E_INTEGRATION_KEYS
) => {
  try {
    return await planeClient.issue.getIssueWithExternalId(
      entityConnection.workspace_slug,
      entityConnection.project_id ?? "",
      issueId.toString(),
      ghIntegrationKey
    );
  } catch {
    return null;
  }
};
