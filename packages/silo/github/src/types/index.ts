import { components } from "@octokit/openapi-webhooks-types";
import { RestEndpointMethodTypes } from "@octokit/rest";

export type GithubEntity = {};

export type GithubConfig = {
  usermap: Record<string, string>;
};

export type GithubInstallation = RestEndpointMethodTypes["apps"]["getInstallation"]["response"]["data"];
export type GithubRepository =
  RestEndpointMethodTypes["apps"]["listReposAccessibleToInstallation"]["response"]["data"]["repositories"];
export type GithubIssue = RestEndpointMethodTypes["issues"]["create"]["parameters"];

export type WebhookGitHubIssue = components["schemas"]["webhooks_issue"];
export type WebhookGitHubLabel = components["schemas"]["webhooks_label"];
export type WebhookGitHubComment = components["schemas"]["webhooks_comment"];
export type WebhookGitHubMilestone = components["schemas"]["webhooks_milestone"];
export type WebhookGitHubUser = components["schemas"]["webhooks_user"];
export type GithubSimpleUser = components["schemas"]["simple-user"];

export type GithubWebhookPayload = components["schemas"];

export type GithubWebhookEvent = keyof GithubWebhookPayload;

export type GithubAuthPayload = {
  code: string;
  state: GithubAuthorizeState;
};

export type GithubUserAuthPayload = {
  code: string;
  state: GithubUserAuthState;
};

export type GithubAuthorizeState = {
  workspace_slug: string;
  workspace_id: string;
  plane_api_token: string;
  target_host: string;
};

export type GithubUserAuthState = GithubAuthorizeState & {
  user_id: string;
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
  appName: string;
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
};

export type GithubIssueDedupPayload = {
  accountId: string;
  issueNumber: string;
  owner: string;
  repositoryId: string;
  installationId: string;
  repositoryName: string;
};

export type AppAuthParams = {
  appId: string;
  privateKey: string;
  installationId: string;
  forUser?: false;
};

export type UserAuthParams = {
  forUser: true;
  accessToken: string;
};

export type GithubApiProps = AppAuthParams | UserAuthParams;
