import { RestEndpointMethodTypes } from "@octokit/rest";

export type GithubEntity = {};

export type GithubConfig = {};

export type GithubInstallation =
  RestEndpointMethodTypes["apps"]["getInstallation"]["response"]["data"];
export type GithubRepository =
  RestEndpointMethodTypes["apps"]["listReposAccessibleToInstallation"]["response"]["data"]["repositories"];

export type GithubAuthPayload = {
  code: string;
  state: GithubAuthorizeState;
};

export type GithubAuthorizeState = {
  workspace_slug: string;
  workspace_id: string;
  plane_api_token: string;
};

export type TokenResponse = {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  refresh_token: string;
  refresh_token_expires_in: number;
};

export type GithubAuthConfig = {
  tokenUrl: string;
  callbackUrl: string;
  appName: string;
};
