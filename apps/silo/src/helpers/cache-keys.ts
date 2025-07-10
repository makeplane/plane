import { EOAuthGrantType } from "@/types/oauth";

export const getTokenCacheKey = (
  appInstallationId: string,
  authorizationType: EOAuthGrantType,
  userId?: string
): string => {
  if (authorizationType === EOAuthGrantType.AUTHORIZATION_CODE) {
    if (!userId) {
      throw new Error("User ID is required for authorization code grant type");
    }
    return `oauth_token:${appInstallationId}:${userId}:${authorizationType}`;
  }
  return `oauth_token:${appInstallationId}:${authorizationType}`;
};

export const getPlaneAppDetailsCacheKey = (appName: string) => `plane_app_details_${appName}`;
