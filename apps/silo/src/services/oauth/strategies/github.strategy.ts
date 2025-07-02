import { E_INTEGRATION_KEYS, E_SILO_ERROR_CODES } from "@plane/etl/core";
import {
  createGithubAuth,
  createGithubService,
  createGithubUserService,
  GithubAuthorizeState,
  GithubAuthService,
  GithubPlaneOAuthState,
  GithubService,
  GithubUserAuthState,
} from "@plane/etl/github";
import {
  TWorkspaceConnection,
  TWorkspaceCredential,
  TWorkspaceEntityConnection,
  TGithubAppConfig,
  TGithubWorkspaceConnectionData,
  TGithubWorkspaceConnection,
} from "@plane/types";
import { getGithubService } from "@/apps/github/helpers";
import { env } from "@/env";
import { OAuthStrategy, OAuthState, OAuthTokenResponse } from "@/services/oauth/types";
import { ESourceAuthorizationType } from "@/types/oauth";
import { Store } from "@/worker/base/store";
import { GITHUB_ENTERPRISE_CONFIG_KEY } from "../../../apps/github-enterprise/helpers";

export type TIntegrationKey = E_INTEGRATION_KEYS.GITHUB_ENTERPRISE | E_INTEGRATION_KEYS.GITHUB;

export class GithubEnterpriseStrategy implements OAuthStrategy {
  private integrationKey: TIntegrationKey;
  private store: Store;

  constructor(integrationKey: TIntegrationKey) {
    this.integrationKey = integrationKey;
    this.store = Store.getInstance();
  }

  async generateConfigKey(data: TGithubAppConfig, workspaceId: string): Promise<string> {
    const configKey = GITHUB_ENTERPRISE_CONFIG_KEY(workspaceId);
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
    const githubAuthService = await this.getGithubAuthService(state.config_key as string);
    return githubAuthService.getAuthUrl(state);
  }

  async getUserAuthUrl(state: OAuthState, wsConnection?: TWorkspaceConnection): Promise<string> {
    const store = Store.getInstance();
    // store the config in the provider config key to later use it in user callback
    const config = (wsConnection?.connection_data as TGithubWorkspaceConnectionData).appConfig;
    if (!Object.keys(config || {}).length) {
      throw new Error(E_SILO_ERROR_CODES.INVALID_APP_CREDENTIALS.toString());
    }
    const configKey = GITHUB_ENTERPRISE_CONFIG_KEY(wsConnection?.workspace_id as string);
    await store.set(configKey, JSON.stringify(config));
    // add the config key to the state to be used in getUserAuthUrl and handleUserCallback
    state.config_key = configKey;

    const githubAuthService = await this.getGithubAuthService(state.config_key as string);
    return githubAuthService.getUserAuthUrl(state);
  }

  async handleRedirectToPlaneOAuth(
    code: string,
    state: string
  ): Promise<{ stateBuffer: string; redirectUri?: string }> {
    const authState: GithubUserAuthState = JSON.parse(Buffer.from(state as string, "base64").toString());
    let redirectUri = `${env.APP_BASE_URL}/${authState.workspace_slug}/settings/integrations/github-enterprise/`;

    if (authState.profile_redirect) {
      redirectUri = `${env.APP_BASE_URL}/${authState.workspace_slug}/settings/account/connections/?workspaceId=${authState.workspace_id}`;
    }

    const githubState: GithubPlaneOAuthState = {
      github_code: code as string,
      encoded_github_state: state as string,
    };

    const stateBuffer = Buffer.from(JSON.stringify(githubState)).toString("base64");

    return {
      stateBuffer,
      redirectUri,
    };
  }

  async handleCallback(
    code: string,
    state: string,
    additionalParams: Record<string, string>
  ): Promise<{ response: OAuthTokenResponse; state: OAuthState; redirectUri?: string }> {
    const { installation_id } = additionalParams;
    if (!installation_id) {
      throw new Error(E_SILO_ERROR_CODES.INVALID_INSTALLATION_ACCOUNT.toString());
    }

    const authState: GithubAuthorizeState = JSON.parse(Buffer.from(state as string, "base64").toString());
    const redirectUri = `${env.APP_BASE_URL}/${authState.workspace_slug}/settings/integrations/github-enterprise/`;

    // Create github service from the installation id
    const service = await this.getGithubService(installation_id as string, authState.config_key as string);

    // Get the installation details
    const installation = await service.getInstallation(Number(installation_id));

    if (!installation?.data.account) {
      throw new Error(E_SILO_ERROR_CODES.INVALID_INSTALLATION_ACCOUNT.toString());
    }

    const config = await this.store.get(authState.config_key as string);

    return {
      response: {
        identifier: installation.data.account.id.toString(),
        authorization_type: ESourceAuthorizationType.TOKEN,
        access_token: installation_id as string,
        connection_id: installation.data.account.id.toString(),
        // @ts-expect-error
        connection_slug: installation.data.account.login,
        refresh_token: "",
        expires_in: 0,
        provider_user_data: null,
        connection_data: { appConfig: JSON.parse(config as string), ...installation.data.account },
      },
      state: {
        workspace_id: authState.workspace_id,
        workspace_slug: authState.workspace_slug,
        user_id: authState.user_id,
        plane_api_token: "",
        target_host: authState.workspace_slug,
        plane_app_installation_id: authState.plane_app_installation_id,
      },
      redirectUri: redirectUri,
    };
  }

  async handlePlaneOAuthCallback(
    encodedIntegrationState: string
  ): Promise<{ response: OAuthTokenResponse; state: OAuthState; redirectUri?: string }> {
    const githubState: GithubPlaneOAuthState = JSON.parse(
      Buffer.from(encodedIntegrationState as string, "base64").toString()
    );

    const { github_code: code, encoded_github_state } = githubState;

    const authState: GithubUserAuthState = JSON.parse(Buffer.from(encoded_github_state as string, "base64").toString());

    let redirectUri = `${env.APP_BASE_URL}/${authState.workspace_slug}/settings/integrations/github-enterprise/`;

    if (authState.profile_redirect) {
      redirectUri = `${env.APP_BASE_URL}/${authState.workspace_slug}/settings/account/connections/?workspaceId=${authState.workspace_id}`;
    }

    const githubAuthService = await this.getGithubAuthService(authState.config_key as string);
    const { response, state: githubUserState } = await githubAuthService.getUserAccessToken({
      code: code as string,
      state: authState,
    });

    const accessToken = this.parseAccessToken(response);
    const githubService = await this.getGithubUserService(accessToken, authState.config_key as string);
    const user = await githubService.getUser();

    if (!user) {
      throw new Error(E_SILO_ERROR_CODES.INVALID_APP_CREDENTIALS.toString());
    }

    return {
      response: {
        identifier: user.id.toString(),
        authorization_type: ESourceAuthorizationType.TOKEN,
        provider_user_data: { githubUser: user },
        connection_id: user.id.toString(),
        connection_slug: user.login,
        access_token: accessToken,
        refresh_token: "",
        expires_in: 0,
      },
      state: {
        workspace_id: githubUserState.workspace_id,
        workspace_slug: githubUserState.workspace_slug,
        user_id: githubUserState.user_id,
        plane_api_token: "",
        target_host: githubUserState.workspace_slug,
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
    const githubService = getGithubService(
      wsConnection as TGithubWorkspaceConnection,
      wsCredential.source_access_token as string,
      true
    );
    const installation = await githubService.getInstallation(Number(wsCredential.source_access_token));

    if (!installation?.data.account) {
      throw new Error(E_SILO_ERROR_CODES.INVALID_INSTALLATION_ACCOUNT.toString());
    }

    let isDeleted = false;
    let deletionResult = null;

    try {
      deletionResult = await githubService.deleteInstallation(Number(wsCredential.source_access_token));
      isDeleted = deletionResult.status === 204;
    } catch (error: any) {
      if (error && error?.response?.status === 404) {
        isDeleted = true;
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

  private parseAccessToken(response: string): string {
    // Split the response into key-value pairs
    const pairs = response.split("&");

    // Find the pair that starts with "access_token"
    const accessTokenPair = pairs.find((pair) => pair.startsWith("access_token="));

    if (!accessTokenPair) {
      throw new Error("Access token not found in the response");
    }

    // Split the pair and return the value (index 1)
    const [, accessToken] = accessTokenPair.split("=");

    if (!accessToken) {
      throw new Error("Access token is empty");
    }

    return accessToken;
  }

  private async getGithubService(installationId: string, configKey: string): Promise<GithubService> {
    const config = await this.store.get(configKey);
    if (!config) {
      throw new Error(E_SILO_ERROR_CODES.INVALID_APP_CREDENTIALS.toString());
    }
    const { appId, privateKey, baseUrl } = JSON.parse(config) as TGithubAppConfig;
    return createGithubService(appId, privateKey, installationId, baseUrl);
  }

  private async getGithubUserService(accessToken: string, configKey: string): Promise<GithubService> {
    const config = await this.store.get(configKey);
    if (!config) {
      throw new Error(E_SILO_ERROR_CODES.INVALID_APP_CREDENTIALS.toString());
    }
    const { baseUrl } = JSON.parse(config) as TGithubAppConfig;
    return createGithubUserService(accessToken, baseUrl);
  }

  private async getGithubAuthService(configKey: string): Promise<GithubAuthService> {
    const config = await this.store.get(configKey);
    if (!config) {
      throw new Error(E_SILO_ERROR_CODES.INVALID_APP_CREDENTIALS.toString());
    }
    const { appName, clientId, clientSecret, baseUrl } = JSON.parse(config) as TGithubAppConfig;
    const callbackUrl = encodeURI(
      env.SILO_API_BASE_URL + env.SILO_BASE_PATH + "/api/oauth/github-enterprise/auth/user/callback"
    );
    return createGithubAuth(appName, clientId, clientSecret, callbackUrl, baseUrl, true);
  }
}
