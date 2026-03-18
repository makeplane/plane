/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

export type BitbucketUser = {
  slug: string;
  id: string | number;
  displayName: string;
  name?: string;
  emailAddress?: string | null;
  type?: string;
};

export type BitbucketProject = {
  key: string;
  id: string | number;
  name: string;
};

export type BitbucketLink = {
  href: string;
};

export type BitbucketRepository = {
  slug: string;
  id: string | number;
  name: string;
  project: BitbucketProject;
  links?: {
    self?: BitbucketLink[];
  };
};

export type BitbucketPullRequestState = "OPEN" | "MERGED" | "DECLINED" | "SUPERSEDED";

export type BitbucketPullRequest = {
  id: number;
  version?: number;
  title: string;
  description?: string;
  state: BitbucketPullRequestState | (string & {});
  open?: boolean;
  closed?: boolean;
  author?: {
    user?: BitbucketUser;
  };
  fromRef: {
    id: string;
    displayId: string;
    latestCommit?: string;
    repository: BitbucketRepository;
  };
  toRef: {
    id: string;
    displayId: string;
    latestCommit?: string;
    repository: BitbucketRepository;
  };
  links?: {
    self?: BitbucketLink[];
  };
};

export type BitbucketPRComment = {
  id: string | number;
  version: number;
  text: string;
  createdDate: number;
  updatedDate: number;
  deleted?: boolean;
  author?:
    | {
        user?: BitbucketUser;
      }
    | BitbucketUser;
};

export type BitbucketPullRequestActivity = {
  id: number;
  action?: string;
  createdDate?: number;
  comment?: BitbucketPRComment;
  [key: string]: unknown;
};

export type BitbucketWebhookEventKey =
  | "pr:opened"
  | "pr:merged"
  | "pr:declined"
  | "pr:deleted"
  | "pr:modified"
  | "pr:comment:added"
  | "pr:comment:edited"
  | "pr:comment:deleted";

export type BitbucketWebhookPayload = {
  eventKey?: BitbucketWebhookEventKey | (string & {});
  date?: string | number;
  actor?: BitbucketUser;
  pullRequest?: BitbucketPullRequest;
  comment?: BitbucketPRComment;
  repository?: BitbucketRepository;
  [key: string]: unknown;
};

export type BitbucketPaginatedResponse<T> = {
  values: T[];
  start: number;
  limit: number;
  size?: number;
  isLastPage: boolean;
  nextPageStart?: number;
};

export type BitbucketAuthConfig = {
  baseUrl: string;
  clientId?: string;
  clientSecret?: string;
  callbackUrl?: string;
  personalAccessToken?: string;
};

export type BitbucketOAuthConfig = {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  webhookSecret?: string;
  redirectUri: string;
};

export type BitbucketAuthorizeState = {
  workspace_id: string;
  workspace_slug: string;
  user_id: string;
  plane_api_token: string;
  plane_app_installation_id?: string;
  config_key?: string;
  is_user_flow?: boolean;
  profile_redirect?: boolean;
};

export type BitbucketPlaneOAuthState = {
  bitbucket_code: string;
  encoded_bitbucket_state: string;
};

export type BitbucketTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  created_at?: number;
};

export type BitbucketApiProps = {
  baseUrl: string;
  accessToken: string;
  projectKey?: string;
  repoSlug?: string;
  refreshToken?: string;
  clientId?: string;
  clientSecret?: string;
  refreshCallback?: (accessToken: string, refreshToken: string) => Promise<void>;
};

export type BitbucketPullRequestDedupPayload = {
  action: BitbucketPullRequestWebhookAction;
  projectKey: string;
  repositoryId: string;
  repoSlug: string;
  repositoryName: string;
  pullRequestId: string;
  eventActorId: string;
  sourceBaseUrl?: string;
};

export type BitbucketPullRequestWebhookAction =
  | "pr:opened"
  | "pr:merged"
  | "pr:declined"
  | "pr:deleted"
  | "pr:modified";

export type BitbucketPRCommentWebhookAction = "pr:comment:added" | "pr:comment:edited" | "pr:comment:deleted";

export enum EBitbucketEntityConnectionType {
  PROJECT_PR_AUTOMATION = "PROJECT_PR_AUTOMATION",
}
