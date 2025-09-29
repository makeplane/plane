import { GitLabService } from "./api.service";
import { GitLabAuthService } from "./auth.service";

export const createGitLabAuth = (props: {
  baseUrl?: string;
  clientId: string | undefined;
  clientSecret: string | undefined;
  redirectUri: string;
}): GitLabAuthService => {
  const { baseUrl, clientId, clientSecret, redirectUri } = props;
  if (!clientId || !clientSecret) {
    console.error("[GITLAB] Client ID and client secret are required");
  }
  return new GitLabAuthService({
    baseUrl,
    clientId: clientId ?? "",
    clientSecret: clientSecret ?? "",
    redirectUri,
  });
};

export const createGitLabService = (
  access_token: string,
  refresh_token: string,
  refresh_callback: (access_token: string, refresh_token: string) => Promise<void>,
  baseUrl: string = "https://gitlab.com",
  clientId?: string,
  clientSecret?: string
): GitLabService => new GitLabService(access_token, refresh_token, refresh_callback, baseUrl, clientId, clientSecret);
