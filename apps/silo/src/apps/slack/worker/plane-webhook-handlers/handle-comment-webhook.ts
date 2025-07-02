import TurndownService from "turndown";
import { TSlackIssueEntityData } from "@plane/etl/slack";
import { WebhookIssueCommentPayload } from "@plane/sdk";
import { env } from "@/env";
import { logger } from "@/logger";
import { getConnectionDetailsForIssue } from "../../helpers/connection-details";
import { getPlaneContentParser } from "../../helpers/content-parser";
import { TSlackWorkspaceConnectionConfig } from "../../types/types";

export const handleIssueCommentWebhook = async (payload: WebhookIssueCommentPayload) => {
  await handleCommentSync(payload);
};

const handleCommentSync = async (payload: WebhookIssueCommentPayload) => {
  const data = payload as unknown as WebhookIssueCommentPayload["created"];

  // Return the comment if it's already connected to any exisitng connection
  if (data.data.external_id !== null) return;

  logger.info("Received issue comment webhook", {
    payload: data,
  });

  const details = await getConnectionDetailsForIssue({
    id: data.data.issue,
    workspace: data.data.workspace,
    project: data.data.project,
    issue: data.data.issue,
    event: payload.event,
    isEnterprise: false,
  }, data.data.created_by);

  if (!details) {
    logger.error("No details found for issue comment webhook", {
      payload: data,
    });
    return;
  }

  const { isUser, entityConnection, slackService, workspaceConnection } = details;

  const slackData = entityConnection.entity_data as TSlackIssueEntityData;

  const channel = slackData.channel;

  const config = workspaceConnection.config as TSlackWorkspaceConnectionConfig

  const userMap = new Map<string, string>()
  for (const user of config.userMap ?? []) {
    userMap.set(user.planeUserId, user.slackUser)
  }

  const parser = getPlaneContentParser({
    appBaseUrl: env.APP_BASE_URL,
    workspaceSlug: workspaceConnection.workspace_slug,
    userMap,
  })
  const comment = await parser.toPlaneHtml(data.data.comment_html);
  const turndown = new TurndownService({
    headingStyle: "atx",
    bulletListMarker: "-",
    codeBlockStyle: "fenced",
    emDelimiter: "_",
    strongDelimiter: "**",
    linkStyle: "inlined",
  })

  turndown.addRule("link", {
    filter: (node) => node.tagName === "A",
    replacement: (content, node) => `<${(node as Element).getAttribute("href")}|${content}>`
  })

  let markdown = turndown.turndown(comment)

  // If we don't have the credentials of the user, in that case we'll add the user's information to the comment
  if (!isUser && payload.activity.actor) {
    const displayName = payload.activity.actor.display_name;
    markdown = `*From ${displayName}*\n\n${markdown}`;
  }

  const response = await slackService.sendThreadMessage(channel, entityConnection.entity_id ?? "", markdown);

  logger.info("Slack message sent", {
    slackMessageId: response.ts,
    slackChannelId: channel,
    slackThreadTs: entityConnection.entity_id,
    slackMessage: comment,
  });
};
