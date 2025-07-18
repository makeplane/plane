export type SentryAuthConfig = {
  clientId: string;
  clientSecret: string;
  baseUrl: string;
  integrationSlug: string;
}

export type SentryAuthState = {
  userId: string;
  workspaceId: string;
  workspaceSlug: string;
  planeAppInstallationId: string;
}

export type SentryAuthTokenResponse = {
  id: string;
  token: string;
  refreshToken: string;
  dateCreated: string;
  expiresAt: string;
  state: null;
  application: null;
}
