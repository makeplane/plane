import { TWorkspaceConnection, TWorkspaceCredential, TWorkspaceEntityConnection } from "@plane/types";
import { env } from "@/env";
import { EOAuthGrantType, PlaneOAuthAppInstallation, PlaneOAuthTokenResponse } from "@/types/oauth";
import { planeOAuthService } from "../auth";
import { OAuthState, OAuthStrategy, OAuthTokenResponse } from "../types";

export class PlaneOAuthStrategy implements OAuthStrategy {
  private clientId: string;
  private clientSecret: string;

  constructor(clientId: string, clientSecret: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  getAuthUrl(state: OAuthState): string {
    return planeOAuthService.getPlaneOAuthRedirectUrl(this.clientId, this.clientSecret, JSON.stringify(state));
  }

  getUserAuthUrl(state: OAuthState): string {
    throw new Error("Method not implemented.");
  }

  async handleCallback(
    code: string,
    state: string
  ): Promise<{ response: OAuthTokenResponse; state: OAuthState; redirectUri?: string }> {
    const appInstallationId = state;
    const tokenResponse: PlaneOAuthTokenResponse = await planeOAuthService.generateToken({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      grant_type: EOAuthGrantType.CLIENT_CREDENTIALS,
      app_installation_id: appInstallationId,
    });

    const appInstallation: PlaneOAuthAppInstallation = await planeOAuthService.getAppInstallation(
      tokenResponse.access_token,
      appInstallationId
    );

    // TODO: Create webhook for the application

    return {
      response: {
        access_token: tokenResponse.access_token,
        connection_id: appInstallationId,
        connection_slug: appInstallation.workspace_detail.slug,
        refresh_token: tokenResponse.refresh_token,
        expires_in: tokenResponse.expires_in,
        provider_user_data: null,
        connection_data: null,
      },
      state: {
        workspace_id: appInstallation.workspace_detail.id,
        workspace_slug: appInstallation.workspace_detail.slug,
        user_id: appInstallation.installed_by,
        plane_api_token: "",
        target_host: appInstallation.workspace_detail.slug,
      },
      redirectUri: `${env.APP_BASE_URL}/${appInstallation.workspace_detail.slug}/settings/applications/`,
    };
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

  disconnectOrganization(
    wsConnection: TWorkspaceConnection,
    wsCredential: TWorkspaceCredential,
    entityConnections?: TWorkspaceEntityConnection[]
  ): Promise<boolean> {
    throw new Error("Method not implemented.");
  }

  disconnectUser(wsConnection: TWorkspaceConnection, wsCredential: TWorkspaceCredential): Promise<boolean> {
    throw new Error("Method not implemented.");
  }

  async handleRedirectToPlaneOAuth(
    code: string,
    state: string
  ): Promise<{ stateBuffer: string; redirectUri?: string }> {
    throw new Error("Method not implemented.");
  }

  async handlePlaneOAuthCallback(
    encodedIntegrationState: string
  ): Promise<{ response: OAuthTokenResponse; state: OAuthState; redirectUri?: string }> {
    throw new Error("Method not implemented.");
  }

  async generateConfigKey(data: object, workspaceId: string): Promise<string> {
    throw new Error("Method not implemented.");
  }
}
