import { GitLabAuthService } from "./auth.service";
import { GitLabService } from "./api.service";

export const createGitLabAuth = (props: {
  host?: string;
  clientId: string | undefined;
  clientSecret: string | undefined;
  redirectUri: string;
}): GitLabAuthService => {
  const { host, clientId, clientSecret, redirectUri } = props;
  if (!clientId || !clientSecret) {
    console.error("[GITLAB] Client ID and client secret are required");
  }
  return new GitLabAuthService({
    host,
    clientId: clientId ?? "",
    clientSecret: clientSecret ?? "",
    redirectUri,
  });
};

export const createGitLabService = (
  access_token: string,
  refresh_token: string,
  refresh_callback: (access_token: string, refresh_token: string) => Promise<void>,
  hostname: string = "gitlab.com"
): GitLabService => new GitLabService(access_token, refresh_token, refresh_callback, hostname);
