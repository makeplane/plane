import { E_INTEGRATION_KEYS, TServiceCredentials } from "@plane/etl/core";
import {
  GithubWebhookPayload,
  transformGitHubComment,
  WebhookGitHubComment,
} from "@plane/etl/github";
import { ExIssueComment, Client as PlaneClient } from "@plane/sdk";
import { TGithubWorkspaceConnection } from "@plane/types";
import { getGithubService } from "@/apps/github/helpers";
import { getConnectionDetails } from "@/apps/github/helpers/helpers";
import { GithubEntityConnection } from "@/apps/github/types";

import { env } from "@/env";
import { getPlaneAPIClient } from "@/helpers/plane-api-client";
import { logger } from "@/logger";
import { getAPIClient } from "@/services/client";
import { Store } from "@/worker/base";
import { shouldSync } from "./issue.handler";

const apiClient = getAPIClient();

export type GithubCommentAction = "created" | "edited" | "deleted";

export type GithubCommentWebhookPayload = GithubWebhookPayload["webhook-issue-comment-created" | "webhook-issue-comment-edited"] & {
  isEnterprise: boolean;
};

export const handleIssueComment = async (store: Store, action: GithubCommentAction, data: unknown) => {
  // @ts-expect-error
  if (data && data.comment && data.comment.id) {
    // @ts-expect-error
    const exist = await store.get(`silo:comment:${data.comment.id}`);
    if (exist) {
      logger.info("[GITHUB][COMMENT] Event Processed Successfully, confirmed by target");
      // Remove the webhook from the store
      // @ts-expect-error
      await store.del(`silo:comment:${data.comment.id}`);
      return true;
    }
  }

  await syncCommentWithPlane(
    store,
    action,
    data as GithubCommentWebhookPayload
  );

  return true;
};

export const syncCommentWithPlane = async (
  store: Store,
  action: GithubCommentAction,
  data: GithubCommentWebhookPayload
) => {
  if (!data.installation || !shouldSync(data.issue.labels) || data.comment.user?.type !== "User") {
    return;
  }
  const ghIntegrationKey = data.isEnterprise ? E_INTEGRATION_KEYS.GITHUB_ENTERPRISE : E_INTEGRATION_KEYS.GITHUB;
  const [planeCredentials] = await apiClient.workspaceCredential.listWorkspaceCredentials({
    source: ghIntegrationKey,
    source_access_token: data.installation.id.toString(),
  });
  const accountId = data.organization ? data.organization.id : data.repository.owner.id;

  const { workspaceConnection, entityConnection } = await getConnectionDetails({
    accountId: accountId.toString(),
    credentials: planeCredentials as TServiceCredentials,
    installationId: data.installation.id.toString(),
    repositoryId: data.repository.id.toString(),
    isEnterprise: data.isEnterprise,
  });

  if (!workspaceConnection.target_hostname) {
    throw new Error("Target hostname not found");
  }

  if (!entityConnection) return;

  const planeClient = await getPlaneAPIClient(planeCredentials, ghIntegrationKey);

  const ghService = getGithubService(workspaceConnection as TGithubWorkspaceConnection, data.installation.id.toString(), data.isEnterprise);
  const commentHtml = await ghService.getCommentHtml(
    data.repository.owner.login,
    data.repository.name,
    data.issue.number.toString(),
    data.comment.id
  );

  const issue = await getPlaneIssue(planeClient, entityConnection, data.issue.number.toString(), ghIntegrationKey);

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
  } catch (error) { }

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

const getPlaneIssue = async (planeClient: PlaneClient, entityConnection: GithubEntityConnection, issueId: string, ghIntegrationKey: string) => {
  try {
    return await planeClient.issue.getIssueWithExternalId(
      entityConnection.workspace_slug,
      entityConnection.project_id ?? "",
      issueId.toString(),
      ghIntegrationKey
    );
  } catch {
    throw new Error("Issue not found in Plane");
  }
};
