import { GithubService } from "./api.service";
import { GithubAuthService } from "./auth.service";

export const createGithubAuth = (
  appName: string = "",
  clientId: string = "",
  clientSecret: string = "",
  callbackUrl: string
): GithubAuthService => {
  if (!appName || !clientId || !clientSecret) {
    console.error("[GITHUB] App name, client ID and client secret are required");
  }
  return new GithubAuthService({
    appName,
    clientId,
    clientSecret,
    callbackUrl,
  });
};

export const createGithubService = (
  GithubAppId: string | undefined,
  GithubPrivateKey: string | undefined,
  installationId: string
): GithubService => {
  if (!GithubAppId || !GithubPrivateKey) {
    throw new Error("GithubAppId and GithubPrivateKey are required");
  }
  return new GithubService({
    appId: GithubAppId,
    privateKey: GithubPrivateKey,
    installationId,
    forUser: false,
  });
};

export const createGithubUserService = (accessToken: string): GithubService => {
  if (!accessToken) {
    throw new Error("Access token is required");
  }
  return new GithubService({
    accessToken,
    forUser: true,
  });
};
