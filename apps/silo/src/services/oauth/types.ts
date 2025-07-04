import { z } from "zod";
import { TWorkspaceConnection, TWorkspaceCredential, TWorkspaceEntityConnection } from "@plane/types";

export interface OAuthState {
  workspace_id: string;
  workspace_slug: string;
  user_id: string;
  plane_api_token?: string;
  target_host: string;
  profile_redirect?: boolean;
  source_hostname?: string;
  plane_app_installation_id?: string;
  config_key?: string; // for any config data stored in redis
}

export interface OAuthTokenResponse {
  identifier?: string;
  authorization_type?: string;
  access_token: string;
  connection_id: string;
  connection_slug: string;
  refresh_token?: string;
  expires_in?: number;
  provider_user_data?: any; // Provider-specific user data object with key e.g. { githubUser: { id: string, login: string, name: string } }
  connection_data?: any;
}

export interface OAuthConnectionStatus {
  isConnected: boolean;
  connections: TWorkspaceConnection[];
}

// Core OAuth operations that each provider must implement
export interface OAuthStrategy {
  /**
   * get the auth url for the organization
   * @param state - the state from the callback
   * @returns the auth url
   */
  getAuthUrl(state: OAuthState): Promise<string> | string;
  /**
   * get the auth url for the user
   * @param state - the state from the callback
   * @returns the auth url
   */
  getUserAuthUrl(state: OAuthState, wsConnection?: TWorkspaceConnection): Promise<string> | string;
  /**
   * generate a config key for the provider to store in redis for any config data
   * @param data - the data to generate the config key from
   * @param workspaceId - the workspace id
   * @returns the config key
   */
  generateConfigKey(data: object, workspaceId: string): Promise<string>;
  /**
   * handle the callback for the organization
   * @param code - the code from the callback
   * @param state - the state from the callback
   * @param additionalParams - the additional params in the query for callback
   */
  handleCallback(
    code: string,
    state: string,
    additionalParams?: Record<string, string>
  ): Promise<{ response: OAuthTokenResponse; state: OAuthState; redirectUri?: string }>;
  /**
   * check if the user connection is supported
   * @returns true if the user connection is supported
   */
  isUserConnectionSupported(): boolean;
  /**
   * handle the callback for the user
   * @param code - the code from the callback
   * @param state - the state from the callback
   * @returns the response and state
   */
  handleUserCallback(
    code: string,
    state: string
  ): Promise<{ response: OAuthTokenResponse; state: OAuthState; redirectUri?: string }>;
  /**
   * handle the post user callback after plane oauth
   * @param encodedIntegrationState - the encoded integration state which includes plane's oauth code and the integration state
   * @returns the response and state
   */
  handlePlaneOAuthCallback(
    encodedIntegrationState: string
  ): Promise<{ response: OAuthTokenResponse; state: OAuthState; redirectUri?: string }>;
  /**
   * handle the pre user callback before sending it for plane oauth
   * @param code - the code from the callback
   * @param state - the state from the callback
   * @returns the state buffer and redirect uri
   */
  handleRedirectToPlaneOAuth(code: string, state: string): Promise<{ stateBuffer: string; redirectUri?: string }>;
  /**
   * disconnect the organization connection
   * @param wsConnection - the workspace connection
   * @param wsCredential - the workspace credential
   * @param entityConnections - the entity connections
   * @returns true if the organization connection is disconnected
   */
  disconnectOrganization(
    wsConnection: TWorkspaceConnection,
    wsCredential: TWorkspaceCredential,
    entityConnections?: TWorkspaceEntityConnection[]
  ): Promise<boolean>;
  /**
   * disconnect the user connection
   * @param wsConnection - the workspace connection
   * @param wsCredential - the workspace credential
   * @returns true if the user connection is disconnected
   */
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
