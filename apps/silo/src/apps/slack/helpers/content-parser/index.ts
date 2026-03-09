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

import type { IParserExtension } from "@/lib/parser";
import { ContentParser, ExternalMentionParserExtension, PlaneMentionParserExtension } from "@/lib/parser";
import type { SlackService } from "@plane/etl/slack";
import { logger } from "@plane/logger";

export type TSlackContentParserConfig = {
  slackService: SlackService;
  userMap: Map<string, string>;
  teamDomain: string;
};

export const getSlackContentParser = (config: TSlackContentParserConfig) => {
  const extensions: IParserExtension[] = [
    // For channels - process first since they're less likely to have entity mappings
    new ExternalMentionParserExtension({
      mentionSymbol: "#",
      entityMap: new Map<string, string>(), // Empty map for channels
      fallbackOptions: {
        async replaceWithLink(mention) {
          let displayName = `Slack Channel: ${mention}`;

          try {
            const conversationInfo = await config.slackService.getConversationInfo(mention);
            if (conversationInfo && conversationInfo.ok && conversationInfo.channel.is_channel === true) {
              displayName = conversationInfo.channel.name;
            } else {
              logger.warn(
                "[SLACK] Not ok response recieved for getting channel info for mention parser fallback",
                conversationInfo
              );
            }
          } catch (error) {
            logger.warn("[SLACK] Error while fetching channel info as fallback for channel mention", error, mention);
          }

          return [displayName, `https://${config.teamDomain}.slack.com/archives/${mention}`];
        },
      },
    }),
    // For users - process second since they might have entity mappings
    new ExternalMentionParserExtension({
      mentionSymbol: "@",
      entityMap: config.userMap,
      fallbackOptions: {
        async replaceWithLink(mention) {
          let displayName = `Slack user: ${mention}`;

          try {
            const userInfo = await config.slackService.getUserInfo(mention);
            if (userInfo && userInfo.ok) {
              displayName = userInfo.user.real_name;
            } else {
              logger.warn(
                "[SLACK] Not ok response recieved for getting user info for mention parser fallback",
                userInfo
              );
            }
          } catch (error) {
            logger.warn("[SLACK] Error while fetching user info as fallback for user mention", error, mention);
          }

          // Get the username from the
          return [displayName, `https://${config.teamDomain}.slack.com/team/${mention}`];
        },
      },
    }),

    new ExternalMentionParserExtension({
      mentionSymbol: "!",
      entityMap: new Map<string, string>(),
      fallbackOptions: {
        // oxlint-disable-next-line @typescript-eslint/require-await
        async replaceWithLink(mention) {
          return [`Slack Broadcast: ${mention}`, `https://${config.teamDomain}.slack.com/team/${mention}`];
        },
      },
    }),
  ];

  return new ContentParser(extensions, [], []);
};

export type TPlaneContentParserConfig = {
  workspaceSlug: string;
  appBaseUrl: string;
  userMap: Map<string, string>; // Map of slack user id to plane user id
};

export const getPlaneContentParser = (config: TPlaneContentParserConfig) => {
  const extensions: IParserExtension[] = [
    new PlaneMentionParserExtension({
      callback: (mentionData) => {
        const user = config.userMap.get(mentionData.entityIdentifier ?? "");
        if (!user) {
          return {
            type: "link",
            label: "Plane User",
            link: `${config.appBaseUrl}/${config.workspaceSlug}/profile/${mentionData.entityIdentifier}`,
          };
        } else {
          return {
            type: "text",
            text: `<@${user}>`,
          };
        }
      },
    }),
  ];

  return new ContentParser(extensions, [], []);
};
