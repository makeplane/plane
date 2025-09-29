import { components } from "@octokit/openapi-webhooks-types";
import { RestEndpointMethodTypes } from "@octokit/rest";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type GithubEntity = {}; // TODO: add expected type

export type GithubConfig = {
  usermap: Record<string, string>;
};

export type GithubInstallation = RestEndpointMethodTypes["apps"]["getInstallation"]["response"]["data"];
export type GithubRepository =
  RestEndpointMethodTypes["apps"]["listReposAccessibleToInstallation"]["response"]["data"]["repositories"];
export type GithubIssue = RestEndpointMethodTypes["issues"]["create"]["parameters"];
export type GithubIssueComment = RestEndpointMethodTypes["issues"]["createComment"]["response"]["data"];
export type GithubPullRequest = RestEndpointMethodTypes["pulls"]["get"]["response"]["data"];

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
  user_id: string;
  plane_api_token?: string;
  target_host: string;
  plane_app_installation_id?: string;
  config_key?: string;
};

export type GithubUserAuthState = Omit<GithubAuthorizeState, "plane_api_token"> & {
  user_id: string;
  plane_api_token?: string;
  profile_redirect?: boolean;
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

export type GithubEnterpriseAuthConfig = GithubAuthConfig & {
  baseGithubUrl: string;
};

export type BaseDedupPayload = {
  accountId: string;
  owner: string;
  repositoryId: string;
  installationId: string;
  repositoryName: string;
  isEnterprise: boolean;
  eventActorId: string;
};

export type GithubIssueDedupPayload = BaseDedupPayload & {
  issueNumber: string;
};

export type GithubPullRequestDedupPayload = BaseDedupPayload & {
  pullRequestNumber: string;
};

export type AppAuthParams = {
  appId: string;
  privateKey: string;
  installationId: string;
  baseGithubUrl?: string;
  forUser?: false;
};

export type UserAuthParams = {
  baseGithubUrl?: string;
  forUser: true;
  accessToken: string;
};

export type GithubApiProps = AppAuthParams | UserAuthParams;

export type GithubPlaneOAuthState = {
  github_code: string;
  encoded_github_state: string;
};

export enum EGithubEntityConnectionType {
  PROJECT_PR_AUTOMATION = "PROJECT_PR_AUTOMATION",
  PROJECT_ISSUE_SYNC = "PROJECT_ISSUE_SYNC",
}
