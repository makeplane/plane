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

import { v4 as uuid } from "uuid";
import type { SlackEventPayload, SlackService } from "@plane/etl/slack";
import { logger } from "@plane/logger";
import { getConnectionDetails } from "@/apps/slack/helpers/connection-details";
import { getAccountConnectionBlocks } from "@/apps/slack/views/account-connection";
import { env } from "@/env";
import type { TAIInferenceResponse, AIResponse } from "./app-mention.types";
import { AIResponseType } from "./app-mention.types";
/* oxlint-disable @typescript-eslint/no-explicit-any */

export const handleAppMentionEvent = async (data: SlackEventPayload) => {
  logger.info("Handling app mention event", { data });

  if (data.event.type !== "app_mention") {
    return;
  }

  const currentMessageTs = data.event.ts;
  const threadTs = data.event.thread_ts || null;

  if (!env.AI_SERVICE_BASE_URL) {
    logger.info("Ignoring app mention event because AI service is not configured");
    return;
  }
  const slackUserId = data.event.user;
  const connectionDetails = await getConnectionDetails(data.team_id, { id: slackUserId });
  if (!connectionDetails) {
    logger.info("Ignoring app mention event because we don't have connection details");
    return;
  }

  const { planeClient, slackService } = connectionDetails;

  if (connectionDetails.missingUserCredentials) {
    logger.warn("User didn't connect their slack account while trying mentions");
    await slackService.sendEphemeralMessage(
      slackUserId,
      "Please connect your Slack account to Plane to use this feature.",
      data.event.channel,
      undefined,
      getAccountConnectionBlocks(connectionDetails)
    );

    return;
  }

  const botUserIds = data.authorizations
    .filter((authorization) => authorization.is_bot)
    .map((authorization) => authorization.user_id);

  const userPrompt = await getUserPromptFromThread(
    slackService,
    data.event.channel,
    currentMessageTs,
    data.event.text,
    botUserIds,
    threadTs
  );

  logger.info("User prompt", { ts: currentMessageTs, team_id: data.team_id, userPrompt });

  const token = planeClient.options.bearerToken || planeClient.options.apiToken;
  if (!token) {
    logger.error("No token found for the plane client");
    return;
  }

  await slackService.addReaction(data.event.channel, data.event.ts, "eyes");

  const aiResponse = await inferResponseFromPlaneAI(token, {
    text: userPrompt,
    user_id: connectionDetails.credentials.user_id,
    workspace_id: connectionDetails.workspaceConnection.workspace_id,
  });

  const { message, unfurl } = mapAIResponseToSlackMessage(aiResponse);
  await slackService.sendThreadMessage(data.event.channel, data.event.ts, message, {}, unfurl);

  await slackService.removeReaction(data.event.channel, data.event.ts, "eyes");
};

const getUserPromptFromThread = async (
  slackService: SlackService,
  channel: string,
  currentMessageTs: string,
  currentMessageText: string,
  botUserIds: string[],
  threadTs: string | null
) => {
  let userPrompt = "";
  if (threadTs) {
    const threadMessages = await slackService.fetchPreviousMessagesInThread(channel, threadTs);
    userPrompt =
      "Here is the conversation history for context:" +
      "\n===================\n" +
      threadMessages
        .filter((message) => message.ts !== currentMessageTs)
        .map(
          (message) =>
            (botUserIds.includes(message.user) ? "Assistant: " : "User: ") + removeMentionFromText(message.text)
        )
        .join("\n") +
      "\n===================\n";
  }
  userPrompt += "πCurrent user messageπ:\n" + removeMentionFromText(currentMessageText);
  return userPrompt;
};

const inferResponseFromPlaneAI = async (
  token: string,
  request: { text: string; user_id: string; workspace_id: string }
) => {
  const aiRequest = {
    query: request.text,
    user_id: request.user_id,
    is_new: true,
    is_temp: false,
    workspace_id: request.workspace_id,
    workspace_in_context: true,
    context: {},
    chat_id: uuid(),
    source: "app",
    llm: "gpt-4.1",
  };

  const response = await fetch(`${env.AI_SERVICE_BASE_URL}/api/v1/chat/silo-app/answer/`, {
    method: "POST",
    body: JSON.stringify(aiRequest),
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const data: TAIInferenceResponse = (await response.json()) as TAIInferenceResponse;

  logger.info("Response from Plane AI", { data });
  return data;
};

const mapAIResponseToSlackMessage = (
  aiInferenceResponse: TAIInferenceResponse
): { message: { text?: string; blocks?: any[] }; unfurl: boolean } => {
  const responseData = aiInferenceResponse.response;

  switch (aiInferenceResponse.response_type) {
    case AIResponseType.ACTIONS:
      return createActionBlocks(aiInferenceResponse);
    case AIResponseType.CLARIFICATION:
      return createClarificationBlocks(aiInferenceResponse);
    case AIResponseType.RESPONSE:
      return createResponseBlocks(aiInferenceResponse.response);
    default:
      return {
        message: {
          text: convertMarkdownToSlackFormat(responseData.text),
        },
        unfurl: false,
      };
  }
};

const createResponseBlocks = (
  aiResponse: AIResponse
): { message: { text?: string; blocks?: any[] }; unfurl: boolean } => {
  const blocks: any[] = [];
  if (aiResponse.entities == null || aiResponse.entities.length === 0) {
    return {
      message: {
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: aiResponse.text ?? "No results found",
            },
          },
        ],
      },
      unfurl: false,
    };
  }
  const headerText = aiResponse.text ?? "Here are the top results I found";

  // Create bullet point list of entities
  const entityList = aiResponse.entities
    .map((entity) => `• *${entity.name}* - ${entity.properties.url ?? entity.properties.identifier}`)
    .join("\n");

  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: `${headerText}\n\n${entityList}`,
    },
  });
  return {
    message: {
      text: headerText,
      blocks: blocks.length > 0 ? blocks : undefined,
    },
    unfurl: aiResponse.entities && aiResponse.entities.length <= 5,
  };
};

const createActionBlocks = (
  aiInferenceResponse: TAIInferenceResponse
): { message: { text?: string; blocks?: any[] }; unfurl: boolean } => {
  const blocks: any[] = [];
  const actions = aiInferenceResponse.context?.actions || [];
  const actionSummary = aiInferenceResponse.context?.action_summary;

  // Check if there are any failed actions
  const hasFailures = actions.some((action) => !action.success);
  const hasSuccesses = actions.some((action) => action.success);

  // Add summary header if there are multiple actions or mixed results
  if (actionSummary && (actionSummary.total_planned > 1 || (hasFailures && hasSuccesses))) {
    const summaryText = `*Action Summary:* ${actionSummary.completed} completed, ${actionSummary.failed} failed`;
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: summaryText,
      },
    });
    blocks.push({
      type: "divider",
    });
  }

  // Process each action
  for (const action of actions) {
    if (!action.success) {
      // Handle failed actions with subtle messaging
      const actionDescription = `${action.action} ${action.artifact_type}`;

      // Combine message into a single, softer block
      const errorText = `Couldn't ${actionDescription}. An error occurred while processing your request.`;

      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: errorText,
        },
      });

      // Add divider between actions
      if (action !== actions[actions.length - 1]) {
        blocks.push({
          type: "divider",
        });
      }
    } else {
      // Handle successful actions - only link the entity name, not the entire message
      let actionDescription = action.message;
      if (action.entity && action.entity.entity_name) {
        const entityUrl = action.entity.entity_url;
        // Replace the entity name in the message with a link
        actionDescription += ` ${entityUrl}`;
      }

      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: actionDescription,
        },
      });

      // Add divider between actions
      if (action !== actions[actions.length - 1]) {
        blocks.push({
          type: "divider",
        });
      }
    }
  }

  // Fallback text for notifications
  const fallbackText = actions
    .map((action) => (action.success ? action.message : `Failed to ${action.action} ${action.artifact_type}`))
    .join("; ");

  return {
    message: {
      text: fallbackText,
      blocks: blocks.length > 0 ? blocks : undefined,
    },
    unfurl: true,
  };
};

const createClarificationBlocks = (
  aiInferenceResponse: TAIInferenceResponse
): { message: { text?: string; blocks?: any[] }; unfurl: boolean } => {
  const blocks: any[] = [];
  const clarificationData = aiInferenceResponse.clarification_data;

  // Add questions section
  if (clarificationData?.questions && clarificationData.questions.length > 0) {
    const questionsText =
      clarificationData.questions.length > 1
        ? clarificationData.questions.map((q, index) => `${index + 1}. ${q}`).join("\n")
        : clarificationData.questions[0];

    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*I need some clarification*\n\n${questionsText}`,
      },
    });
  }

  // Add suggestions if available
  if (clarificationData?.disambiguation_options && clarificationData.disambiguation_options.length > 0) {
    const suggestions = clarificationData.disambiguation_options.slice(0, 3);

    // Add suggestions header
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: "*Did you mean one of these?*",
      },
    });

    // Add each suggestion as a formatted section
    suggestions.forEach((option, index) => {
      const displayName = option.name || option.display_name || option.title || "Unknown";
      const identifier = option.email || option.identifier || option.id || "";
      const optionType = option.type ? `\n_Type: ${option.type}_` : "";

      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*${index + 1}.* ${displayName}${identifier ? ` ${identifier}` : ""}${optionType}`,
        },
      });
    });
  }

  // Fallback text for notifications
  const fallbackText = clarificationData?.questions?.join(" ") || "I need some clarification.";

  return {
    message: {
      text: fallbackText,
      blocks: blocks.length > 0 ? blocks : undefined,
    },
    unfurl: false,
  };
};

const convertMarkdownToSlackFormat = (text: string): string => {
  // Convert markdown bold (**text**) to Slack bold (*text*)
  let formatted = text.replace(/\*\*([^*]+)\*\*/g, "*$1*");
  // Convert markdown list items (- ) to Slack bullet points (• )
  formatted = formatted.replace(/^- /gm, "• ");
  return formatted;
};

const removeMentionFromText = (text: string) => text.replace(/<@[^>]+>/g, "");
