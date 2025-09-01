export type GitLabAuthConfig = {
  host?: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
};

export type GitLabAuthorizeState = {
  user_id: string;
  workspace_slug: string;
  workspace_id: string;
  plane_api_token: string;
  gitlab_hostname: string;
  source_hostname?: string; // generic field for oauth controller migration
  target_host: string;
  plane_app_installation_id?: string;
};

export type GitLabAuthPayload = {
  code: string;
  state: string;
};

export type GitlabPlaneOAuthState = {
  gitlab_code: string;
  encoded_gitlab_state: string;
};

export type GitLabTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
  created_at: number;
};
