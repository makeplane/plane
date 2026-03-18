/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { EBitbucketEntityConnectionType } from "@plane/etl/bitbucket";
import { logger } from "@plane/logger";
import type { ExIssueComment, ExIssueLink, PlaneWebhookPayload } from "@plane/sdk";
import type { TBitbucketEntityConnection, TBitbucketWorkspaceConnection, TWorkspaceCredential } from "@plane/types";
import { E_INTEGRATION_KEYS } from "@plane/types";
import { BitbucketContentParser } from "@/apps/bitbucket-dc/helpers/content-parser";
import { doesBitbucketEntityConnectionMatchRepository } from "@/apps/bitbucket-dc/helpers/helpers";
import {
  BITBUCKET_TO_PLANE_COMMENT_CACHE_KEY,
  buildBitbucketSyncComment,
  extractBitbucketSyncCommentMarker,
  parseBitbucketPullRequestLink,
  PLANE_TO_BITBUCKET_COMMENT_CACHE_KEY,
} from "@/apps/bitbucket-dc/helpers/sync";
import { BitbucketIntegrationService } from "@/apps/bitbucket-dc/services/bitbucket-dc.service";
import { integrationConnectionHelper } from "@/helpers/integration-connection-helper";
import { getPlaneAPIClient } from "@/helpers/plane-api-client";
import type { Store } from "@/worker/base";

const contentParser = new BitbucketContentParser();

type PlaneBitbucketWebhookPayload = PlaneWebhookPayload & {
  action?: string;
};

type BitbucketSyncContext = {
  baseUrl: string;
  credential: TWorkspaceCredential;
  workspaceConnection: TBitbucketWorkspaceConnection;
  entityConnections: TBitbucketEntityConnection[];
};

type BitbucketPullRequestTarget = {
  context: BitbucketSyncContext;
  projectKey: string;
  repoSlug: string;
  pullRequestId: string;
};

const getBitbucketSyncContexts = async (workspaceId: string, projectId: string): Promise<BitbucketSyncContext[]> => {
  const entityConnections = (await integrationConnectionHelper.findWorkspaceEntityConnections({
    workspace_id: workspaceId,
    project_id: projectId,
    entity_type: E_INTEGRATION_KEYS.BITBUCKET_DC,
    type: EBitbucketEntityConnectionType.PROJECT_PR_AUTOMATION,
  })) as TBitbucketEntityConnection[];

  const bidirectionalEntityConnections = entityConnections.filter(
    (entityConnection) => entityConnection.config?.allowBidirectionalSync
  );

  if (bidirectionalEntityConnections.length === 0) {
    return [];
  }

  const workspaceConnectionIds = [
    ...new Set(bidirectionalEntityConnections.map((entity) => entity.workspace_connection_id)),
  ];

  const contexts: BitbucketSyncContext[] = [];
  for (const workspaceConnectionId of workspaceConnectionIds) {
    const workspaceConnection = (await integrationConnectionHelper.getWorkspaceConnection({
      connection_id: workspaceConnectionId,
    })) as TBitbucketWorkspaceConnection | null;
    if (!workspaceConnection) {
      continue;
    }

    const credential = await integrationConnectionHelper.getWorkspaceCredential({
      credential_id: workspaceConnection.credential_id,
    });
    const baseUrl = workspaceConnection.connection_data?.baseUrl || credential.source_hostname;

    if (!credential.source_access_token || !baseUrl) {
      continue;
    }

    contexts.push({
      baseUrl,
      credential,
      workspaceConnection,
      entityConnections: bidirectionalEntityConnections.filter(
        (entityConnection) => entityConnection.workspace_connection_id === workspaceConnectionId
      ),
    });
  }

  return contexts;
};

const getPullRequestTargetsFromIssueLinks = (
  issueLinks: ExIssueLink[],
  contexts: BitbucketSyncContext[]
): BitbucketPullRequestTarget[] => {
  const targets: BitbucketPullRequestTarget[] = [];
  const targetKeys = new Set<string>();

  for (const context of contexts) {
    for (const issueLink of issueLinks) {
      if (!issueLink.url) {
        continue;
      }

      const parsedLink = parseBitbucketPullRequestLink(issueLink.url, context.baseUrl);
      if (!parsedLink) {
        continue;
      }

      const hasMatchingEntityConnection = context.entityConnections.some((entityConnection) =>
        doesBitbucketEntityConnectionMatchRepository(entityConnection, {
          repoSlug: parsedLink.repoSlug,
          projectKey: parsedLink.projectKey,
        })
      );

      if (!hasMatchingEntityConnection) {
        continue;
      }

      const targetKey = `${context.workspaceConnection.id}:${parsedLink.projectKey}:${parsedLink.repoSlug}:${parsedLink.pullRequestId}`;
      if (targetKeys.has(targetKey)) {
        continue;
      }

      targetKeys.add(targetKey);
      targets.push({
        context,
        projectKey: parsedLink.projectKey,
        repoSlug: parsedLink.repoSlug,
        pullRequestId: parsedLink.pullRequestId,
      });
    }
  }

  return targets;
};

const syncCommentToBitbucketPullRequest = async (
  store: Store,
  target: BitbucketPullRequestTarget,
  planeCommentId: string,
  action: string,
  planeComment: ExIssueComment | null
): Promise<void> => {
  const pullRequestNumber = Number(target.pullRequestId);
  if (Number.isNaN(pullRequestNumber)) {
    logger.info("[BITBUCKET][PLANE] Invalid pull request id in issue link, skipping", {
      pullRequestId: target.pullRequestId,
    });
    return;
  }

  const appConfig = target.context.workspaceConnection.connection_data?.appConfig;
  const pullRequestService = new BitbucketIntegrationService(
    target.context.baseUrl,
    target.context.credential.source_access_token!,
    appConfig && target.context.credential.source_refresh_token
      ? {
          refreshToken: target.context.credential.source_refresh_token,
          clientId: appConfig.clientId,
          clientSecret: appConfig.clientSecret,
          refreshCallback: async (accessToken, refreshToken) => {
            await integrationConnectionHelper.createOrUpdateWorkspaceCredential({
              workspace_id: target.context.workspaceConnection.workspace_id,
              user_id: target.context.credential.user_id,
              source: E_INTEGRATION_KEYS.BITBUCKET_DC,
              source_access_token: accessToken,
              source_refresh_token: refreshToken,
              target_access_token: target.context.credential.target_access_token || "",
            });
          },
        }
      : undefined
  );

  const pullRequestComments = await pullRequestService.getPullRequestComments(
    target.projectKey,
    target.repoSlug,
    target.pullRequestId
  );
  const existingComment = pullRequestComments.find(
    (comment) => extractBitbucketSyncCommentMarker(comment.body) === planeCommentId
  );

  if (action === "deleted") {
    if (!existingComment) {
      return;
    }

    await pullRequestService.deletePullRequestComment(
      target.projectKey,
      target.repoSlug,
      existingComment.id.toString(),
      pullRequestNumber
    );

    await store.set(BITBUCKET_TO_PLANE_COMMENT_CACHE_KEY(existingComment.id.toString()), "true", 60);
    return;
  }

  if (!planeComment) {
    return;
  }

  const markdownBody = contentParser.htmlToMarkdown(planeComment.comment_html || "");
  const bitbucketCommentBody = buildBitbucketSyncComment(markdownBody, planeCommentId);

  const syncedComment = existingComment
    ? await pullRequestService.updatePullRequestComment(
        target.projectKey,
        target.repoSlug,
        existingComment.id.toString(),
        bitbucketCommentBody,
        pullRequestNumber
      )
    : await pullRequestService.createPullRequestComment(
        target.projectKey,
        target.repoSlug,
        target.pullRequestId,
        bitbucketCommentBody
      );

  await store.set(BITBUCKET_TO_PLANE_COMMENT_CACHE_KEY(syncedComment.id.toString()), "true", 60);
};

const handleIssueCommentWebhook = async (store: Store, data: PlaneBitbucketWebhookPayload): Promise<void> => {
  const payloadId = data?.id ?? "";
  if (!payloadId) {
    logger.info("[BITBUCKET][PLANE] Missing Plane comment id in webhook payload, skipping");
    return;
  }

  const existsInCache = await store.get(PLANE_TO_BITBUCKET_COMMENT_CACHE_KEY(payloadId));
  if (existsInCache) {
    logger.info("[BITBUCKET][PLANE] Event triggered by Bitbucket->Plane sync, skipping to prevent loop");
    await store.del(PLANE_TO_BITBUCKET_COMMENT_CACHE_KEY(payloadId));
    return;
  }

  const syncContexts = await getBitbucketSyncContexts(data.workspace, data.project);
  if (syncContexts.length === 0) {
    logger.info("[BITBUCKET][PLANE] No bidirectional Bitbucket entity connections found, skipping", {
      workspace: data.workspace,
      project: data.project,
    });
    return;
  }

  const primaryContext = syncContexts[0];
  const planeClient = await getPlaneAPIClient(primaryContext.credential, E_INTEGRATION_KEYS.BITBUCKET_DC);

  const planeIssue = await planeClient.issue.getIssue(
    primaryContext.workspaceConnection.workspace_slug,
    data.project,
    data.issue
  );
  const issueLinks = await planeClient.issue.getLinks(
    primaryContext.workspaceConnection.workspace_slug,
    data.project,
    planeIssue.id
  );

  const pullRequestTargets = getPullRequestTargetsFromIssueLinks(issueLinks.results || [], syncContexts);
  if (pullRequestTargets.length === 0) {
    logger.info("[BITBUCKET][PLANE] No linked Bitbucket pull request URLs found on Plane issue, skipping", {
      issueId: planeIssue.id,
      workspace: data.workspace,
      project: data.project,
    });
    return;
  }

  const action = data.action || "updated";
  const planeComment =
    action === "deleted"
      ? null
      : await planeClient.issueComment.getComment(
          primaryContext.workspaceConnection.workspace_slug,
          data.project,
          data.issue,
          data.id
        );

  for (const pullRequestTarget of pullRequestTargets) {
    await syncCommentToBitbucketPullRequest(store, pullRequestTarget, data.id, action, planeComment);
  }

  logger.info("[BITBUCKET][PLANE] Issue comment sync completed", {
    action,
    planeCommentId: data.id,
    pullRequestCount: pullRequestTargets.length,
  });
};

const handleIssueCommentSync = async (store: Store, data: PlaneBitbucketWebhookPayload): Promise<void> => {
  try {
    await handleIssueCommentWebhook(store, data);
  } catch (error) {
    logger.error("[BITBUCKET][PLANE] Error syncing issue comment to Bitbucket", error);
    throw error;
  }
};

export const handleIssueComment = async (store: Store, data: PlaneBitbucketWebhookPayload): Promise<void> => {
  await handleIssueCommentSync(store, data);

  logger.info("[BITBUCKET][PLANE] Issue comment webhook received and processed", {
    workspace: data.workspace,
    project: data.project,
    issue: data.issue,
  });
};
