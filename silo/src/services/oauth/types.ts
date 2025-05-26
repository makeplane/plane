import { z } from "zod";
import { TWorkspaceConnection, TWorkspaceCredential, TWorkspaceEntityConnection } from "@plane/types";

export interface OAuthState {
  workspace_id: string;
  workspace_slug: string;
  user_id: string;
  plane_api_token: string;
  target_host: string;
  profile_redirect?: boolean;
  source_hostname?: string;
}

export interface OAuthTokenResponse {
  access_token: string;
  connection_id: string;
  connection_slug: string;
  refresh_token?: string;
  expires_in?: number;
  provider_user_data?: any; // Provider-specific user data
  connection_data?: any;
}

export interface OAuthConnectionStatus {
  isConnected: boolean;
  connections: TWorkspaceConnection[];
}

// Core OAuth operations that each provider must implement
export interface OAuthStrategy {
  getAuthUrl(state: OAuthState): string;
  getUserAuthUrl(state: OAuthState): string;
  handleCallback(
    code: string,
    state: string
  ): Promise<{ response: OAuthTokenResponse; state: OAuthState; redirectUri?: string }>;
  isUserConnectionSupported(): boolean;
  handleUserCallback(
    code: string,
    state: string
  ): Promise<{ response: OAuthTokenResponse; state: OAuthState; redirectUri?: string }>;
  disconnectOrganization(
    wsConnection: TWorkspaceConnection,
    wsCredential: TWorkspaceCredential,
    entityConnections?: TWorkspaceEntityConnection[]
  ): Promise<boolean>;
  disconnectUser(wsConnection: TWorkspaceConnection, wsCredential: TWorkspaceCredential): Promise<boolean>;
}

export interface OAuthStrategyConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  apiBaseUrl?: string;
  scope?: string[];
}

export enum E_INTEGRATION_DISCONNECT_SOURCE {
  INTERNAL = "INTERNAL",
  EXTERNAL = "EXTERNAL",
}

export const userMapSchema = z.array(
  z.object({
    planeUser: z.object({
      id: z.string(),
      email: z.string().email().nullable(),
      name: z.string().optional().nullable(),
      avatarUrl: z.string().url().optional(),
    }),
    integrationUser: z.any(),
  })
);

export type IntegrationUserMap = z.infer<typeof userMapSchema>;
