import { SlackTokenRefreshResponse } from "../types";
import { SlackService } from "./api.service";
import { SlackAuthService } from "./auth.service";

export const createSlackAuth = (
  clientId: string = "",
  clientSecret: string = "",
  userRedirectUri: string = "",
  teamRedirectUri: string = "",
): SlackAuthService => {
  if (!clientId || !clientSecret || !userRedirectUri || !teamRedirectUri) {
    console.error(
      "[SLACK] Client Id, Client Secret, User Redirect URI and Team Redirect URI are required",
    );
  }
  return new SlackAuthService({
    clientId,
    clientSecret,
    user_redirect_uri: userRedirectUri,
    team_redirect_uri: teamRedirectUri,
  });
};

export const createSlackService = (
  accessToken: string | undefined,
  refreshToken: string | undefined,
  authService: SlackAuthService | undefined,
  authCallback: (tokenResponse: SlackTokenRefreshResponse) => Promise<void>,
): SlackService => {
  if (!accessToken || !refreshToken || !authService || !authCallback) {
    throw new Error(
      "Access token, refreshToken, authService and authCallback are required",
    );
  }
  return new SlackService(accessToken, refreshToken, authService, authCallback);
};
