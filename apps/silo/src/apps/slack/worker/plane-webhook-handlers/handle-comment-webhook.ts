import TurndownService from "turndown";
import { TSlackIssueEntityData } from "@plane/etl/slack";
import { PlaneWebhookPayload } from "@plane/sdk";
import { env } from "@/env";
import { logger } from "@/logger";
import { getConnectionDetailsForIssue } from "../../helpers/connection-details";
import { getPlaneContentParser } from "../../helpers/content-parser";
import { TSlackWorkspaceConnectionConfig } from "../../types/types";

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

  const config = workspaceConnection.config as TSlackWorkspaceConnectionConfig;

  const userMap = new Map<string, string>();
  for (const user of config.userMap ?? []) {
    userMap.set(user.planeUserId, user.slackUser);
  }

  const parser = getPlaneContentParser({
    appBaseUrl: env.APP_BASE_URL,
    workspaceSlug: workspaceConnection.workspace_slug,
    userMap,
  });
  const comment = await parser.toPlaneHtml(commentData.comment_html);
  const turndown = new TurndownService({
    headingStyle: "atx",
    bulletListMarker: "-",
    codeBlockStyle: "fenced",
    emDelimiter: "_",
    strongDelimiter: "**",
    linkStyle: "inlined",
  });

  turndown.addRule("link", {
    filter: (node) => node.tagName === "A",
    replacement: (content, node) => `<${(node as Element).getAttribute("href")}|${content}>`,
  });

  let markdown = turndown.turndown(comment);

  // If we don't have the credentials of the user, in that case we'll add the user's information to the comment
  if (!isUser) {
    // Find the user in the list
    let displayName = payload.actor_display_name;
    // Fallback logic to get the display name from the user
    if (!displayName) {
      const users = await planeClient.users.list(entityConnection.workspace_slug, commentData.project);
      const user = users.find((user) => user.id === commentData.actor);
      displayName = user?.display_name;
    }

    if (displayName) {
      markdown = `*From ${displayName}*\n\n${markdown}`;
    }
  }

  const response = await slackService.sendThreadMessage(channel, entityConnection.entity_id ?? "", markdown);

  logger.info("Slack message sent", {
    slackMessageId: response.ts,
    slackChannelId: channel,
    slackThreadTs: entityConnection.entity_id,
    slackMessage: comment,
  });
};
