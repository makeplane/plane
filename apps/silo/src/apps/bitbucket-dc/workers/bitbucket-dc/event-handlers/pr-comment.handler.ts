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

import type { BitbucketPRCommentWebhookAction, BitbucketUser, BitbucketWebhookPayload } from "@plane/etl/bitbucket";
import { logger } from "@plane/logger";
import type { ExIssueComment } from "@plane/sdk";
import { E_INTEGRATION_KEYS } from "@plane/types";
import { BitbucketContentParser } from "@/apps/bitbucket-dc/helpers/content-parser";
import { resolveBitbucketWebhookContext } from "@/apps/bitbucket-dc/helpers/helpers";
import {
  BITBUCKET_TO_PLANE_COMMENT_CACHE_KEY,
  extractBitbucketBaseUrlFromRepositoryUrl,
  extractBitbucketBaseUrlFromPullRequestUrl,
  hasBitbucketSyncCommentMarker,
  PLANE_TO_BITBUCKET_COMMENT_CACHE_KEY,
  removeBitbucketSyncCommentMarker,
} from "@/apps/bitbucket-dc/helpers/sync";
import { getReferredIssues } from "@/helpers/parser";
import { getPlaneAPIClient } from "@/helpers/plane-api-client";
import type { Store } from "@/worker/base";
const contentParser = new BitbucketContentParser();

type BitbucketCommentAuthor = NonNullable<BitbucketWebhookPayload["comment"]>["author"];

const getCommentAuthor = (author: BitbucketCommentAuthor | undefined): BitbucketUser | undefined => {
  if (!author) {
    return undefined;
  }

  if ("slug" in author) {
    return author;
  }

  return author.user;
};

const getCommentAuthorDisplayName = (payload: BitbucketWebhookPayload): string => {
  const commentAuthor = getCommentAuthor(payload.comment?.author);
  if (commentAuthor?.displayName) {
    return commentAuthor.displayName;
  }

  if (payload.actor?.displayName) {
    return payload.actor.displayName;
  }

  if (commentAuthor?.slug) {
    return commentAuthor.slug;
  }

  if (payload.actor?.slug) {
    return payload.actor.slug;
  }

  return "Bitbucket user";
};

const getActorIdentifier = (payload: BitbucketWebhookPayload): string => {
  if (payload.actor?.id !== undefined) {
    return payload.actor.id.toString();
  }

  return payload.actor?.slug ?? "";
};

const getPullRequestUrl = (payload: BitbucketWebhookPayload): string =>
  payload.pullRequest?.links?.self?.[0]?.href ?? "";

const getExistingPlaneComment = async (
  workspaceSlug: string,
  projectId: string,
  issueId: string,
  commentId: string,
  planeClient: Awaited<ReturnType<typeof getPlaneAPIClient>>
): Promise<ExIssueComment | null> => {
  try {
    return await planeClient.issueComment.getIssueCommentWithExternalId(
      workspaceSlug,
      projectId,
      issueId,
      commentId,
      E_INTEGRATION_KEYS.BITBUCKET_DC
    );
  } catch (_error) {
    return null;
  }
};

const syncPullRequestCommentWithPlane = async (
  store: Store,
  action: BitbucketPRCommentWebhookAction,
  payload: BitbucketWebhookPayload
): Promise<void> => {
  const pullRequest = payload.pullRequest;
  const comment = payload.comment;
  const repository = pullRequest?.toRef?.repository || payload.repository;

  if (!pullRequest || !comment || !repository?.project?.key || !repository.slug || repository.id === undefined) {
    logger.info("[BITBUCKET][PR-COMMENT] Missing required webhook data, skipping", {
      pullRequestId: pullRequest?.id,
    });
    return;
  }

  const repositoryId = repository.id.toString();
  const pullRequestUrl = getPullRequestUrl(payload);
  const sourceBaseUrl =
    extractBitbucketBaseUrlFromPullRequestUrl(pullRequestUrl) ||
    extractBitbucketBaseUrlFromRepositoryUrl(repository.links?.self?.[0]?.href || "");

  const context = await resolveBitbucketWebhookContext({
    sourceBaseUrl,
    repositoryId,
    repoSlug: repository.slug,
    projectKey: repository.project.key,
    actorIdentifier: getActorIdentifier(payload),
    logPrefix: "[BITBUCKET][PR-COMMENT]",
  });

  if (!context) {
    return;
  }

  const { workspaceConnection, planeCredentials } = context;

  const pullRequestText = `${pullRequest.title}\n${pullRequest.description || ""}`;
  const references = getReferredIssues(pullRequestText);
  const allReferences = [...references.closingReferences, ...references.nonClosingReferences];

  if (allReferences.length === 0) {
    logger.info("[BITBUCKET][PR-COMMENT] No Plane work item references found in pull request", {
      pullRequestId: pullRequest.id,
    });
    return;
  }

  const planeClient = await getPlaneAPIClient(planeCredentials, E_INTEGRATION_KEYS.BITBUCKET_DC);

  const cleanedCommentText = removeBitbucketSyncCommentMarker(comment.text || "");
  const commentHtml = contentParser.markdownToHtml(cleanedCommentText);
  const pullRequestOverviewUrl = pullRequestUrl ? `${pullRequestUrl}/overview` : "";
  const commentMetadata = `<p><em>Comment synced from Bitbucket pull request #${pullRequest.id} by ${getCommentAuthorDisplayName(payload)}${pullRequestOverviewUrl ? ` (<a href="${pullRequestOverviewUrl}">view pull request</a>)` : ""}</em></p>`;
  const planeCommentHtml = contentParser.sanitizeHtml(`${commentHtml}${commentMetadata}`);

  for (const reference of allReferences) {
    let issue;
    try {
      issue = await planeClient.issue.getIssueByIdentifier(
        workspaceConnection.workspace_slug,
        reference.identifier,
        reference.sequence,
        true
      );
    } catch {
      logger.info("[BITBUCKET][PR-COMMENT] Referred Plane issue not found, skipping", {
        issueIdentifier: `${reference.identifier}-${reference.sequence}`,
      });
      continue;
    }

    const existingComment = await getExistingPlaneComment(
      workspaceConnection.workspace_slug,
      issue.project,
      issue.id,
      comment.id.toString(),
      planeClient
    );

    if (action === "pr:comment:deleted") {
      if (existingComment) {
        await planeClient.issueComment.destroy(
          workspaceConnection.workspace_slug,
          issue.project,
          issue.id,
          existingComment.id
        );
      }
      continue;
    }

    const planeCommentPayload = {
      comment_html: planeCommentHtml,
      external_id: comment.id.toString(),
      external_source: E_INTEGRATION_KEYS.BITBUCKET_DC,
    };

    if (existingComment) {
      await planeClient.issueComment.update(
        workspaceConnection.workspace_slug,
        issue.project,
        issue.id,
        existingComment.id,
        planeCommentPayload
      );
      await store.set(PLANE_TO_BITBUCKET_COMMENT_CACHE_KEY(existingComment.id), "true", 60);
      continue;
    }

    try {
      const createdComment = (await planeClient.issueComment.create(
        workspaceConnection.workspace_slug,
        issue.project,
        issue.id,
        planeCommentPayload
      )) as ExIssueComment;
      await store.set(PLANE_TO_BITBUCKET_COMMENT_CACHE_KEY(createdComment.id), "true", 60);
    } catch (createError) {
      logger.info("[BITBUCKET][PR-COMMENT] Skipping duplicate comment, already synced to Plane", {
        issueId: issue.id,
        externalId: comment.id.toString(),
        error: createError,
      });
    }
  }
};

export const handlePRCommentEvents = async (
  store: Store,
  action: BitbucketPRCommentWebhookAction,
  data: BitbucketWebhookPayload
) => {
  const commentId = data.comment?.id?.toString();
  if (!commentId) {
    logger.info("[BITBUCKET][PR-COMMENT] Comment id missing in webhook payload, skipping");
    return true;
  }

  const cacheKey = BITBUCKET_TO_PLANE_COMMENT_CACHE_KEY(commentId);
  const existsInCache = await store.get(cacheKey);
  if (existsInCache) {
    logger.info("[BITBUCKET][PR-COMMENT] Event triggered by Plane->Bitbucket sync, skipping to prevent loop");
    await store.del(cacheKey);
    return true;
  }

  if (hasBitbucketSyncCommentMarker(data.comment?.text || "")) {
    logger.info("[BITBUCKET][PR-COMMENT] Ignoring Plane-synced comment marker event");
    return true;
  }

  await syncPullRequestCommentWithPlane(store, action, data);

  return true;
};
