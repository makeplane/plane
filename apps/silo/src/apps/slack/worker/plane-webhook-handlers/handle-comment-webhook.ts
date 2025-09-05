import { TSlackIssueEntityData } from "@plane/etl/slack";
import { PlaneUser, PlaneWebhookPayload } from "@plane/sdk";
import { logger } from "@/logger";
import { getConnectionDetailsForIssue } from "../../helpers/connection-details";
import { getSlackMarkdownFromPlaneHtml } from "../../helpers/parse-plane-resources";
import { getSlackToPlaneUserMapFromWC } from "../../helpers/user";
import { createSyncedSlackCommentBlock } from "../../views/comments";

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
    payload.created_by ?? null
  );

  if (!details) {
    logger.error("No details found for issue comment webhook", {
      payload,
    });
    return;
  }

  const { isUser, entityConnection, slackService, workspaceConnection, planeClient } = details;

  const commentData = await planeClient.issueComment.getComment(
    entityConnection.workspace_slug,
    entityConnection.project_id ?? "",
    payload.issue,
    payload.id
  );

  // Return the comment if it's already connected to any exisitng connection
  if (commentData.external_id !== null) return;

  const slackData = entityConnection.entity_data as TSlackIssueEntityData;

  const channel = slackData.channel;

  const userMap = getSlackToPlaneUserMapFromWC(workspaceConnection);
  const markdown = await getSlackMarkdownFromPlaneHtml({
    workspaceConnection,
    html: commentData.comment_html,
  });

  let displayName = payload.actor_display_name;

  // If we don't have the credentials of the user, in that case we'll add the user's information to the comment
  if (!isUser) {
    // Fallback logic to get the display name from the user
    if (!displayName) {
      const users = await planeClient.users.list(entityConnection.workspace_slug, commentData.project);
      const user = users.find((user: PlaneUser) => user.id === commentData.actor);
      displayName = user?.display_name;
    }
  }

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
};
