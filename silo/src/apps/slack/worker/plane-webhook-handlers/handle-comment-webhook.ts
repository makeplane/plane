import { TSlackIssueEntityData } from "@plane/etl/slack";
import { WebhookIssueCommentPayload } from "@plane/sdk";
import { getAPIClient } from "@/services/client";
import { getConnectionDetailsForIssue } from "../../helpers/connection-details";
import { logger } from "@/logger";

const apiClient = getAPIClient();

export const handleIssueCommentWebhook = async (payload: WebhookIssueCommentPayload) => {
  await handleCommentSync(payload);
};

const handleCommentSync = async (payload: WebhookIssueCommentPayload) => {
  const data = payload as unknown as WebhookIssueCommentPayload["created"];

  // Return the comment if it's already connected to any exisitng connection
  if (data.data.external_id !== null) return

  logger.info("Received issue comment webhook", {
    payload: data,
  });

  const details = await getConnectionDetailsForIssue({
    id: data.data.issue,
    workspace: data.data.workspace,
    project: data.data.project,
    issue: data.data.issue,
    event: payload.event,
  }, data.data.created_by);

  if (!details) {
    logger.error("No details found for issue comment webhook", {
      payload: data,
    });
    return;
  }

  const { isUser, entityConnection, slackService } = details;

  const slackData = entityConnection.entity_data as TSlackIssueEntityData;

  const channel = slackData.channel;

  let comment = data.data.comment_stripped;

  // If we don't have the credentials of the user, in that case we'll add the user's information to the comment
  if (!isUser && payload.activity.actor) {
    const displayName = payload.activity.actor.display_name;
    comment = `*From ${displayName}*\n\n${comment}`;
  }

  const response = await slackService.sendThreadMessage(
    channel,
    entityConnection.entity_id ?? "",
    comment
  );

  logger.info("Slack message sent", {
    slackMessageId: response.ts,
    slackChannelId: channel,
    slackThreadTs: entityConnection.entity_id,
    slackMessage: comment,
  });
};
