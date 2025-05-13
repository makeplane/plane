export enum EOAuthGrantType {
  AUTHORIZATION_CODE = "authorization_code",
  CLIENT_CREDENTIALS = "client_credentials",
  REFRESH_TOKEN = "refresh_token",
}

export type PlaneOAuthTokenOptions = {
  client_id: string;
  client_secret: string;
  redirect_uri?: string;
  code?: string;
  code_verifier?: string;
  grant_type?: EOAuthGrantType;
  app_installation_id?: string;
  user_id?: string;
};

export type PlaneOAuthTokenResponse = {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  refresh_token: string;
};

export enum ESourceAuthorizationType {
  TOKEN = "token",
  OAUTH = "oauth",
}

export type PlaneOAuthAppInstallation = {
  id: string;
  workspace_detail: {
    name: string;
    slug: string;
    id: string;
    logo_url: string | null;
  };
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  status: string;
  created_by: string | null;
  updated_by: string | null;
  workspace: string;
  application: string;
  installed_by: string;
  app_bot: string;
};
