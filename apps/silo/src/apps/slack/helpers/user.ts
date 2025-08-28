import { TWorkspaceConnection } from "@plane/types";
import { getUserProfileUrl } from "@/helpers/urls";
import { TSlackWorkspaceConnectionConfig } from "../types/types";

export const getUserMarkdown = (planeToSlackUserMap: Map<string, string>, workspaceSlug: string, userId: string, displayName?: string) => {
  if (planeToSlackUserMap.has(userId)) {
    return `<@${planeToSlackUserMap.get(userId)}>`;
  }
  return `<${getUserProfileUrl(workspaceSlug, userId)}|${displayName ?? "Plane User"}>`;
};

export const getUserMapFromSlackWorkspaceConnection = (workspaceConnection: TWorkspaceConnection) => {
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
      userMap.set(user.slackUser, user.planeUserId);
    }
  });
  return userMap;
};
