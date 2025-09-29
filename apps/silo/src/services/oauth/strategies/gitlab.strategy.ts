import { E_SILO_ERROR_CODES } from "@plane/etl/core";
import {
  createGitLabAuth,
  createGitLabService,
  GitlabEnterpriseEntityType,
  GitlabEntityData,
  GitLabAuthorizeState,
  GitLabAuthService,
  GitLabService,
} from "@plane/etl/gitlab";
import {
  E_INTEGRATION_KEYS,
  TWorkspaceConnection,
  TWorkspaceCredential,
  TWorkspaceEntityConnection,
  TGitlabAppConfig,
  TGitlabWorkspaceConnectionData,
} from "@plane/types";
import { getGitlabClientService } from "@/apps/gitlab/services";
import { getGitlabAuthCallbackURL, GITLAB_ENTERPRISE_CONFIG_KEY } from "@/apps/gitlab-enterprise/helpers";
import { getIntegrationPageUrl } from "@/helpers/urls";
import { getAPIClient } from "@/services/client";
import { OAuthStrategy, OAuthState, OAuthTokenResponse } from "@/services/oauth/types";
import { ESourceAuthorizationType } from "@/types/oauth";
import { Store } from "@/worker/base/store";

const apiClient = getAPIClient();

export type TGitlabIntegrationKey = E_INTEGRATION_KEYS.GITLAB_ENTERPRISE | E_INTEGRATION_KEYS.GITLAB;

export class GitlabEnterpriseStrategy implements OAuthStrategy {
  private integrationKey: TGitlabIntegrationKey;
  private store: Store;

  constructor(integrationKey: TGitlabIntegrationKey) {
    this.integrationKey = integrationKey;
    this.store = Store.getInstance();
  }

  async generateConfigKey(data: TGitlabAppConfig, workspaceId: string): Promise<string> {
    const configKey = GITLAB_ENTERPRISE_CONFIG_KEY(workspaceId);
    await this.store.del(configKey);
    // remove trailing slash from baseUrl
    data.baseUrl = data.baseUrl.replace(/\/$/, "");
    await this.store.set(configKey, JSON.stringify(data));
    return configKey;
  }

  async getAuthUrl(state: OAuthState): Promise<string> {
    if (!state.config_key) {
      throw new Error(E_SILO_ERROR_CODES.INVALID_APP_CREDENTIALS.toString());
    }
    const gitlabAuthService = await this.getGitlabAuthService(state.config_key as string);
    return gitlabAuthService.getAuthUrl(state);
  }

  async handleCallback(
    code: string,
    state: string,
    additionalParams: Record<string, string>
  ): Promise<{ response: OAuthTokenResponse; state: OAuthState; redirectUri?: string }> {
    if (!code || !state) {
      throw new Error(E_SILO_ERROR_CODES.INVALID_INSTALLATION_ACCOUNT.toString());
    }

    const authState: GitLabAuthorizeState = JSON.parse(Buffer.from(state as string, "base64").toString());
    const redirectUri = getIntegrationPageUrl(authState.workspace_slug, this.integrationKey);

    // Create gitlab auth service
    const gitlabAuthService = await this.getGitlabAuthService(authState.config_key as string);

    const { response: tokenResponse } = await gitlabAuthService.getAccessToken({
      code: code as string,
      state: state as string,
    });

    if (!tokenResponse || !tokenResponse.access_token) {
      throw new Error(E_SILO_ERROR_CODES.ERROR_FETCHING_TOKEN.toString());
    }

    const gitlabService = await this.getGitlabService(
      tokenResponse.access_token,
      tokenResponse.refresh_token,
      authState.workspace_id,
      authState.user_id,
      authState.config_key as string
    );

    const user = await gitlabService.getUser();

    if (!user) {
      throw new Error(E_SILO_ERROR_CODES.USER_NOT_FOUND.toString());
    }

    const config = await this.store.get(authState.config_key as string);
    const appConfig = JSON.parse(config as string) as TGitlabAppConfig;
    const sourceHostname = new URL(appConfig.baseUrl).hostname;

    return {
      response: {
        identifier: user.id.toString(),
        authorization_type: ESourceAuthorizationType.TOKEN,
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token,
        connection_id: user.id.toString(),
        // @ts-expect-error
        connection_slug: user.login,
        expires_in: tokenResponse.expires_in,
        provider_user_data: null,
        connection_data: { appConfig, ...user },
      },
      state: {
        workspace_id: authState.workspace_id,
        workspace_slug: authState.workspace_slug,
        user_id: authState.user_id,
        plane_api_token: "",
        target_host: authState.workspace_slug,
        plane_app_installation_id: authState.plane_app_installation_id,
        source_hostname: sourceHostname,
      },
      redirectUri: redirectUri,
    };
  }

  async disconnectOrganization(
    wsConnection: TWorkspaceConnection,
    wsCredential: TWorkspaceCredential,
    entityConnections?: TWorkspaceEntityConnection[]
  ): Promise<boolean> {
    if (!wsCredential.source_access_token) {
      throw new Error(E_SILO_ERROR_CODES.INVALID_CREDENTIALS.toString());
    }
    const appConfig = (wsConnection.connection_data as TGitlabWorkspaceConnectionData).appConfig;
    if (!appConfig) {
      throw new Error(E_SILO_ERROR_CODES.INVALID_APP_CREDENTIALS.toString());
    }
    const gitlabClientService = await getGitlabClientService(
      wsConnection.workspace_id,
      this.integrationKey,
      appConfig.baseUrl,
      appConfig.clientId,
      appConfig.clientSecret
    );
    let isDeleted = false;
    try {
      if (entityConnections) {
        for (const entityConnection of entityConnections) {
          const entityData = entityConnection.entity_data as GitlabEntityData;
          if (entityData.type === GitlabEnterpriseEntityType.PROJECT) {
            await gitlabClientService.removeWebhookFromProject(entityData.id, entityData.webhookId?.toString());
          } else if (entityData.type === GitlabEnterpriseEntityType.GROUP) {
            await gitlabClientService.removeWebhookFromGroup(entityData.id, entityData.webhookId?.toString());
          }
        }
      }
      isDeleted = true;
    } catch (error: any) {
      if ((error && error?.response?.status === 404) || error?.response?.status === 403) {
        isDeleted = false;
      }
    }
    return isDeleted;
  }

  disconnectUser(wsConnection: TWorkspaceConnection, wsCredential: TWorkspaceCredential): Promise<boolean> {
    return Promise.resolve(true);
  }

  isUserConnectionSupported(): boolean {
    throw new Error("Method not implemented.");
  }

  handleUserCallback(
    code: string,
    state: string
  ): Promise<{ response: OAuthTokenResponse; state: OAuthState; redirectUri?: string }> {
    throw new Error("Method not implemented.");
  }

  async handlePlaneOAuthCallback(
    encodedIntegrationState: string
  ): Promise<{ response: OAuthTokenResponse; state: OAuthState; redirectUri?: string }> {
    throw new Error("Method not implemented.");
  }

  async getUserAuthUrl(state: OAuthState, wsConnection?: TWorkspaceConnection): Promise<string> {
    throw new Error("Method not implemented.");
  }

  async handleRedirectToPlaneOAuth(
    code: string,
    state: string
  ): Promise<{ stateBuffer: string; redirectUri?: string }> {
    throw new Error("Method not implemented.");
  }

  private async gitlabTokenRefreshCallback(
    sourceAccessToken: string,
    sourceRefreshToken: string,
    workspaceId: string,
    userId: string
  ): Promise<void> {
    await apiClient.workspaceCredential.createWorkspaceCredential({
      workspace_id: workspaceId,
      user_id: userId,
      source: this.integrationKey,
      source_identifier: userId,
      source_access_token: sourceAccessToken,
      source_refresh_token: sourceRefreshToken,
    });
  }

  private async getGitlabService(
    accessToken: string,
    refreshToken: string,
    workspaceId: string,
    userId: string,
    configKey: string
  ): Promise<GitLabService> {
    const config = await this.store.get(configKey);
    if (!config) {
      throw new Error(E_SILO_ERROR_CODES.INVALID_APP_CREDENTIALS.toString());
    }
    const { baseUrl } = JSON.parse(config) as TGitlabAppConfig;
    return createGitLabService(
      accessToken,
      refreshToken,
      async (access_token, refresh_token) => {
        await this.gitlabTokenRefreshCallback(access_token, refresh_token, workspaceId, userId);
      },
      baseUrl
    );
  }

  private async getGitlabAuthService(configKey: string): Promise<GitLabAuthService> {
    const config = await this.store.get(configKey);
    if (!config) {
      throw new Error(E_SILO_ERROR_CODES.INVALID_APP_CREDENTIALS.toString());
    }
    const { clientId, clientSecret, baseUrl } = JSON.parse(config) as TGitlabAppConfig;
    const callbackUrl = getGitlabAuthCallbackURL(this.integrationKey);
    return createGitLabAuth({ baseUrl, clientId, clientSecret, redirectUri: callbackUrl });
  }
}
