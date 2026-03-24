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

import { E_SLACK_ENTITY_TYPE, E_SLACK_PROJECT_UPDATES_EVENTS } from "@plane/etl/slack";
import type { TSlackIssueEntityData, TSlackProjectUpdatesConfig } from "@plane/etl/slack";
import { logger } from "@plane/logger";
import type { PlaneUser, PlaneWebhookPayload } from "@plane/sdk";
import { getConnectionDetailsForIssue } from "../../helpers/connection-details";
import { getSlackMarkdownFromPlaneHtml } from "../../helpers/parse-plane-resources";
import { getPlaneToSlackUserMapFromWC, getSlackToPlaneUserMapFromWC } from "../../helpers/user";
import { createCommentLinkback, createSyncedSlackCommentBlock } from "../../views/comments";
import { getAPIClient } from "@/services/client";
import { fetchWorkItemDisplayInfo } from "../../services/alerts";
import { getCommentProjectUpdateText } from "../../helpers/activity";
import { integrationConnectionHelper } from "@/helpers/integration-connection-helper";

const apiClient = getAPIClient();

export const handleIssueCommentWebhook = async (payload: PlaneWebhookPayload) => {
  await handleCommentSync(payload);
};

const handleCommentSync = async (payload: PlaneWebhookPayload) => {
  logger.info("Received issue comment webhook", {
    payload,
  });

  const details = await getConnectionDetailsForIssue(
    {
      id: payload.issue,
      workspace: payload.workspace,
      project: payload.project,
      issue: payload.issue,
      event: payload.event,
      isEnterprise: false,
    },
    payload.created_by ?? null,
    false
  );

  if (!details) {
    logger.error("No details found for issue comment webhook", {
      payload,
    });
    return;
  }

  const { isUser, entityConnection, slackService, workspaceConnection, planeClient } = details;

  const [projectEntityConnection] = await integrationConnectionHelper.getWorkspaceEntityConnections({
    workspace_connection_id: workspaceConnection.id,
    project_id: payload.project ?? undefined,
    entity_type: E_SLACK_ENTITY_TYPE.SLACK_PROJECT_UPDATES,
  });

  if (!entityConnection && !projectEntityConnection) {
    logger.info(
      "[Slack Comment Sync Webhook] Neither entity connection nor project entity connection found for the given issue",
      payload
    );
    return;
  }

  const commentData = await planeClient.issueComment.getComment(
    workspaceConnection.workspace_slug,
    payload.project ?? "",
    payload.issue,
    payload.id
  );

  // Return the comment if it's already connected to any exisitng connection
  if (commentData.external_id !== null) return;

  const userMap = getSlackToPlaneUserMapFromWC(workspaceConnection);
  const planeToSlackUserMap = getPlaneToSlackUserMapFromWC(workspaceConnection);
  const markdown = await getSlackMarkdownFromPlaneHtml({
    workspaceConnection,
    html: commentData.comment_html,
  });

  let displayName = payload.actor_display_name;

  // If we don't have the credentials of the user, in that case we'll add the user's information to the comment
  if (!isUser) {
    // Fallback logic to get the display name from the user
    if (!displayName) {
      const users = await planeClient.users.list(workspaceConnection.workspace_slug, payload.project);
      const user = users.find((user: PlaneUser) => user.id === commentData.actor);
      displayName = user?.display_name;
    }
  }

  if (entityConnection) {
    const slackData = entityConnection.entity_data as TSlackIssueEntityData;

    const channel = slackData.channel;

    const commentBlocks = createSyncedSlackCommentBlock({
      comment: markdown,
      createdById: commentData.actor,
      createdByDisplayName: displayName,
      workspaceSlug: entityConnection.workspace_slug,
      projectId: entityConnection.project_id ?? "",
      issueId: payload.issue,
      isUser,
      userMap,
    });

    const response = await slackService.sendThreadMessage(channel, entityConnection.entity_id ?? "", {
      blocks: commentBlocks,
    });

    logger.info("Slack message sent", {
      slackMessageId: response.ts,
      slackChannelId: channel,
      slackThreadTs: entityConnection.entity_id,
      slackMessage: markdown,
    });
  }

  if (projectEntityConnection) {
    const details = await getConnectionDetailsForIssue(
      {
        id: payload.issue,
        workspace: payload.workspace,
        project: payload.project,
        issue: payload.issue,
        event: payload.event,
        isEnterprise: false,
      },
      null,
      false
    );

    if (!details) {
      logger.error("No details found for issue comment webhook", {
        payload,
      });
      return;
    }

    const { slackService } = details;
    const channel = projectEntityConnection.entity_id;

    // Get the config, extract out the subscribed events from the config and filter activities according to the subscribed events
    const projectUpdatesConfig = projectEntityConnection.config as TSlackProjectUpdatesConfig;
    const subscribedEvents = projectUpdatesConfig?.subscribedEvents as E_SLACK_PROJECT_UPDATES_EVENTS[];

    if (!subscribedEvents) return;

    const includesCommentsUpdateEvent = subscribedEvents.includes(
      E_SLACK_PROJECT_UPDATES_EVENTS.WORK_ITEM_COMMENT_CREATED
    );
    if (!includesCommentsUpdateEvent) {
      return;
    }

    const actorDisplayName = displayName ?? commentData.actor;
    const workItemDisplayInfo = await fetchWorkItemDisplayInfo(
      planeClient,
      workspaceConnection.workspace_slug,
      payload.project,
      payload.issue
    );
    const header = getCommentProjectUpdateText(
      workspaceConnection.workspace_slug,
      displayName!,
      workItemDisplayInfo.identifier,
      workItemDisplayInfo.url
    );

    const commentBlocks = createCommentLinkback({
      blockFormationCtx: {
        workspaceSlug: workspaceConnection.workspace_slug,
        planeToSlackMap: planeToSlackUserMap,
        actorDisplayName: actorDisplayName,
        parsedMarkdownFromAlert: markdown,
        workItemDisplayInfo: workItemDisplayInfo,
      },
      workItemHyperlink: workItemDisplayInfo.url,
      projectId: projectEntityConnection.project_id!,
      issueId: payload.issue,
      createdBy: actorDisplayName,
      header: header,
    });

    const response = await slackService.sendMessageToChannel(channel!, {
      text: header,
      blocks: commentBlocks,
    });

    logger.info("[Slack Project Updates] Pushed activity to slack channel", response);
  }
};
