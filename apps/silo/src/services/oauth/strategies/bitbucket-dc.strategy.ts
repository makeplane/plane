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

import { E_SILO_ERROR_CODES } from "@plane/etl/core";
import type {
  BitbucketOAuthConfig,
  BitbucketAuthorizeState,
  BitbucketOAuthService,
  BitbucketPlaneOAuthState,
  BitbucketUser,
} from "@plane/etl/bitbucket";
import {
  createBitbucketOAuth,
  createBitbucketOAuthService,
  createBitbucketService,
  decodeOAuthState,
} from "@plane/etl/bitbucket";
import { logger } from "@plane/logger";
import type {
  TBitbucketWorkspaceConnection,
  TBitbucketWorkspaceConnectionData,
  TWorkspaceConnection,
  TWorkspaceCredential,
  TWorkspaceEntityConnection,
} from "@plane/types";
import { E_INTEGRATION_KEYS } from "@plane/types";
import { env } from "@/env";
import { getIntegrationPageUrl, getProfileConnectionPageUrl } from "@/helpers/urls";
import { convertIntegrationKeyToProvider } from "@/services/oauth/helpers";
import type { OAuthStrategy, OAuthState, OAuthTokenResponse } from "@/services/oauth/types";
import { ESourceAuthorizationType } from "@/types/oauth";
import { Store } from "@/worker/base/store";

const BITBUCKET_OAUTH_CONFIG_KEY = (workspaceId: string) => `bitbucket-oauth-config:${workspaceId}`;

const getBitbucketAuthCallbackURL = () => {
  const provider = convertIntegrationKeyToProvider(E_INTEGRATION_KEYS.BITBUCKET_DC);
  return encodeURI(env.SILO_API_BASE_URL + env.SILO_BASE_PATH + `/api/oauth/${provider}/auth/callback`);
};

export class BitbucketOAuthStrategy implements OAuthStrategy {
  private store: Store;

  constructor() {
    this.store = Store.getInstance();
  }

  async generateConfigKey(data: BitbucketOAuthConfig, workspaceId: string): Promise<string> {
    const configKey = BITBUCKET_OAUTH_CONFIG_KEY(workspaceId);
    await this.store.del(configKey);
    data.baseUrl = data.baseUrl.replace(/\/$/, "");
    await this.store.set(configKey, JSON.stringify(data));
    return configKey;
  }

  async getAuthUrl(state: OAuthState): Promise<string> {
    if (!state.config_key) {
      throw new Error(E_SILO_ERROR_CODES.INVALID_APP_CREDENTIALS.toString());
    }
    const oauthService = await this.getBitbucketOAuthService(state.config_key);
    return oauthService.getAuthUrl(state as BitbucketAuthorizeState);
  }

  async handleCallback(
    code: string,
    state: string,
    _additionalParams: Record<string, string>
  ): Promise<{ response: OAuthTokenResponse; state: OAuthState; redirectUri?: string }> {
    if (!code || !state) {
      throw new Error(E_SILO_ERROR_CODES.INVALID_INSTALLATION_ACCOUNT.toString());
    }

    const authState = decodeOAuthState(state);
    const redirectUri = getIntegrationPageUrl(authState.workspace_slug, E_INTEGRATION_KEYS.BITBUCKET_DC);

    const oauthService = await this.getBitbucketOAuthService(authState.config_key as string);

    const { response: tokenResponse } = await oauthService.getAccessToken({
      code,
      state,
    });

    if (!tokenResponse || !tokenResponse.access_token) {
      throw new Error(E_SILO_ERROR_CODES.ERROR_FETCHING_TOKEN.toString());
    }

    // Use the access token to get the authenticated user
    const bitbucketApiService = createBitbucketService(
      (await this.getConfig(authState.config_key as string)).baseUrl,
      tokenResponse.access_token
    );

    let connectedUser: BitbucketUser;
    try {
      connectedUser = await bitbucketApiService.getCurrentUser();
    } catch {
      throw new Error(E_SILO_ERROR_CODES.USER_NOT_FOUND.toString());
    }

    const config = await this.getConfig(authState.config_key as string);
    const sourceHostname = config.baseUrl;

    return {
      response: {
        identifier: connectedUser.id.toString(),
        authorization_type: ESourceAuthorizationType.TOKEN,
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token,
        connection_id: `${config.baseUrl}::${connectedUser.id}`,
        connection_slug: connectedUser.slug,
        expires_in: tokenResponse.expires_in,
        provider_user_data: null,
        connection_data: {
          baseUrl: config.baseUrl,
          user: connectedUser,
          appConfig: {
            baseUrl: config.baseUrl,
            clientId: config.clientId,
            clientSecret: config.clientSecret,
            webhookSecret: config.webhookSecret,
          },
        },
      },
      state: {
        workspace_id: authState.workspace_id,
        workspace_slug: authState.workspace_slug,
        user_id: authState.user_id,
        plane_api_token: authState.plane_api_token,
        target_host: authState.workspace_slug,
        plane_app_installation_id: authState.plane_app_installation_id,
        source_hostname: sourceHostname,
      },
      redirectUri,
    };
  }

  async disconnectOrganization(
    wsConnection: TWorkspaceConnection,
    wsCredential: TWorkspaceCredential,
    entityConnections?: TWorkspaceEntityConnection[]
  ): Promise<boolean> {
    if (!entityConnections?.length || !wsCredential.source_access_token) {
      return true;
    }

    const connectionData = (wsConnection as TBitbucketWorkspaceConnection).connection_data;
    const baseUrl = connectionData?.baseUrl || wsCredential.source_hostname;
    if (!baseUrl) {
      return true;
    }

    const appConfig = connectionData?.appConfig;
    const bitbucketService =
      appConfig && wsCredential.source_refresh_token
        ? createBitbucketOAuthService(
            baseUrl,
            wsCredential.source_access_token,
            wsCredential.source_refresh_token,
            appConfig.clientId,
            appConfig.clientSecret,
            async () => {
              // No-op: token refresh not needed during disconnect
            }
          )
        : createBitbucketService(baseUrl, wsCredential.source_access_token);

    for (const entityConnection of entityConnections) {
      const entityData = entityConnection.entity_data as {
        webhookId?: number;
        project?: { key: string };
        slug?: string;
      };
      if (entityData?.webhookId && entityData?.project?.key && entityData?.slug) {
        try {
          await bitbucketService.deleteRepositoryWebhook(
            entityData.project.key,
            entityData.slug,
            entityData.webhookId.toString()
          );
        } catch (err) {
          logger.error("Failed to remove Bitbucket webhook during org disconnect", err);
        }
      }
    }

    return true;
  }

  disconnectUser(_wsConnection: TWorkspaceConnection, _wsCredential: TWorkspaceCredential): Promise<boolean> {
    return Promise.resolve(true);
  }

  isUserConnectionSupported(): boolean {
    return true;
  }

  async getUserAuthUrl(state: OAuthState, wsConnection?: TWorkspaceConnection): Promise<string> {
    const connectionData = wsConnection?.connection_data as TBitbucketWorkspaceConnectionData | undefined;
    const appConfig = connectionData?.appConfig;
    if (!appConfig || !appConfig.clientId || !appConfig.clientSecret || !appConfig.baseUrl) {
      throw new Error(E_SILO_ERROR_CODES.INVALID_APP_CREDENTIALS.toString());
    }

    const configKey = BITBUCKET_OAUTH_CONFIG_KEY(wsConnection?.workspace_id as string);
    await this.store.set(
      configKey,
      JSON.stringify({
        baseUrl: appConfig.baseUrl,
        clientId: appConfig.clientId,
        clientSecret: appConfig.clientSecret,
        webhookSecret: appConfig.webhookSecret,
      })
    );
    state.config_key = configKey;
    state.source_hostname = appConfig.baseUrl;

    // Use the same callback URL as workspace OAuth (the one registered in BB DC's Application Link)
    // and differentiate via is_user_flow flag in the state
    const oauthService = await this.getBitbucketOAuthService(configKey);
    return oauthService.getAuthUrl({ ...state, is_user_flow: true } as BitbucketAuthorizeState);
  }

  async handleUserCallback(
    _code: string,
    _state: string
  ): Promise<{ response: OAuthTokenResponse; state: OAuthState; redirectUri?: string }> {
    throw new Error("Method not implemented.");
  }

  async handleRedirectToPlaneOAuth(
    code: string,
    state: string
  ): Promise<{ stateBuffer: string; redirectUri?: string }> {
    const authState = decodeOAuthState(state);
    let redirectUri = getIntegrationPageUrl(authState.workspace_slug, E_INTEGRATION_KEYS.BITBUCKET_DC);

    if (authState.profile_redirect) {
      redirectUri = getProfileConnectionPageUrl(authState.workspace_slug, authState.workspace_id);
    }

    const bitbucketState: BitbucketPlaneOAuthState = {
      bitbucket_code: code,
      encoded_bitbucket_state: state,
    };

    const stateBuffer = Buffer.from(JSON.stringify(bitbucketState)).toString("base64");

    return {
      stateBuffer,
      redirectUri,
    };
  }

  async handlePlaneOAuthCallback(
    encodedIntegrationState: string
  ): Promise<{ response: OAuthTokenResponse; state: OAuthState; redirectUri?: string }> {
    const bitbucketState: BitbucketPlaneOAuthState = JSON.parse(
      Buffer.from(encodedIntegrationState, "base64").toString()
    );

    const { bitbucket_code: code, encoded_bitbucket_state } = bitbucketState;

    const authState = decodeOAuthState(encoded_bitbucket_state);

    let redirectUri = getIntegrationPageUrl(authState.workspace_slug, E_INTEGRATION_KEYS.BITBUCKET_DC);

    if (authState.profile_redirect) {
      redirectUri = getProfileConnectionPageUrl(authState.workspace_slug, authState.workspace_id);
    }

    const oauthService = await this.getBitbucketOAuthService(authState.config_key as string);

    const { response: tokenResponse } = await oauthService.getAccessToken({
      code,
      state: encoded_bitbucket_state,
    });

    if (!tokenResponse || !tokenResponse.access_token) {
      throw new Error(E_SILO_ERROR_CODES.ERROR_FETCHING_TOKEN.toString());
    }

    const config = await this.getConfig(authState.config_key as string);
    const bitbucketApiService = createBitbucketService(config.baseUrl, tokenResponse.access_token);

    let connectedUser: BitbucketUser;
    try {
      connectedUser = await bitbucketApiService.getCurrentUser();
    } catch {
      throw new Error(E_SILO_ERROR_CODES.USER_NOT_FOUND.toString());
    }

    return {
      response: {
        identifier: connectedUser.id.toString(),
        authorization_type: ESourceAuthorizationType.TOKEN,
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token,
        expires_in: tokenResponse.expires_in,
        connection_id: connectedUser.id.toString(),
        connection_slug: connectedUser.slug,
        provider_user_data: { bitbucketUser: connectedUser },
      },
      state: {
        workspace_id: authState.workspace_id,
        workspace_slug: authState.workspace_slug,
        user_id: authState.user_id,
        plane_api_token: "",
        target_host: authState.workspace_slug,
        source_hostname: config.baseUrl,
        profile_redirect: authState.profile_redirect,
      },
      redirectUri,
    };
  }

  private async getConfig(configKey: string): Promise<BitbucketOAuthConfig> {
    const config = await this.store.get(configKey);
    if (!config) {
      throw new Error(E_SILO_ERROR_CODES.INVALID_APP_CREDENTIALS.toString());
    }
    return JSON.parse(config) as BitbucketOAuthConfig;
  }

  private async getBitbucketOAuthService(configKey: string): Promise<BitbucketOAuthService> {
    const { clientId, clientSecret, baseUrl } = await this.getConfig(configKey);
    const callbackUrl = getBitbucketAuthCallbackURL();
    return createBitbucketOAuth({ baseUrl, clientId, clientSecret, redirectUri: callbackUrl });
  }
}
