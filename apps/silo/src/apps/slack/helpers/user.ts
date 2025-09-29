import { SlackService } from "@plane/etl/slack";
import { logger } from "@plane/logger";
import { TWorkspaceConnection } from "@plane/types";
import { getUserProfileUrl } from "@/helpers/urls";
import { invertStringMap } from "@/helpers/utils";
import { TSlackWorkspaceConnectionConfig } from "../types/types";

export const getUserMarkdown = (
  planeToSlackUserMap: Map<string, string>,
  workspaceSlug: string,
  userId: string,
  displayName?: string,
  disableMention: boolean = false
) => {
  if (planeToSlackUserMap.has(userId) && !disableMention) {
    return `<@${planeToSlackUserMap.get(userId)}>`;
  }
  return `<${getUserProfileUrl(workspaceSlug, userId)}|${displayName ?? "Plane User"}>`;
};

const getSlackToPlaneUserMap = (workspaceConnection: TWorkspaceConnection, inverted = false) => {
  if (!workspaceConnection?.config) {
    throw new Error("Invalid workspace connection or missing config");
  }

  const config = workspaceConnection.config as TSlackWorkspaceConnectionConfig;

  if (!config.userMap || !Array.isArray(config.userMap)) {
    return new Map<string, string>();
  }

  const userMap = new Map<string, string>();
  config.userMap?.forEach((user) => {
    if (user?.slackUser && user?.planeUserId) {
      if (inverted) {
        userMap.set(user.planeUserId, user.slackUser);
      } else {
        userMap.set(user.slackUser, user.planeUserId);
      }
    }
  });
  return userMap;
};

export const getPlaneToSlackUserMapFromWC = (workspaceConnection: TWorkspaceConnection) =>
  getSlackToPlaneUserMap(workspaceConnection, true);
export const getSlackToPlaneUserMapFromWC = (workspaceConnection: TWorkspaceConnection) =>
  getSlackToPlaneUserMap(workspaceConnection, false);
/**
 * Enhance userMap by finding Slack users for Plane users who aren't mapped yet
 */
export const enhanceUserMapWithSlackLookup = async (props: {
  planeUsers: Array<{ id: string; email?: string; display_name: string }>;
  currentUserMap: Map<string, string>; // slack -> plane mapping
  slackService: SlackService;
}): Promise<Map<string, string>> => {
  const { planeUsers, currentUserMap, slackService } = props;

  const planeToSlackMap = invertStringMap(currentUserMap);
  const enhancedMap = new Map(currentUserMap);

  // Find Plane users who aren't in the current userMap
  const unmappedUsers = planeUsers.filter((user) => user.email && !planeToSlackMap.has(user.id));

  if (unmappedUsers.length === 0) {
    return enhancedMap;
  }

  try {
    // Match unmapped Plane users with Slack users by email
    for (const planeUser of unmappedUsers) {
      if (!planeUser.email) {
        logger.warn("Skipping user lookup for user without email", { userId: planeUser.id });
        continue;
      }

      const slackUser = await slackService.userLookupByEmail(planeUser.email);

      if (slackUser.ok) {
        enhancedMap.set(slackUser.user.id, planeUser.id);
      } else {
        logger.warn("Failed to lookup Slack user by email", { email: planeUser.email, error: slackUser.error });
      }
    }
  } catch (error) {
    logger.warn("Failed to enhance user map with Slack lookups", { error });
  }

  return enhancedMap;
};
