import { E_SILO_ERROR_CODES } from "@plane/etl/core";
import { SentryAuthService, SentryAuthState } from "@plane/etl/sentry";
import { TWorkspaceConnection, TWorkspaceCredential, TWorkspaceEntityConnection } from "@plane/types";
import { OAuthState, OAuthStrategy, OAuthTokenResponse } from "../types";

export class SentryOAuthStrategy implements OAuthStrategy {
  constructor(private readonly sentryAuth: SentryAuthService) {}
  generateConfigKey(data: object, workspaceId: string): Promise<string> {
    throw new Error("Method not implemented.");
  }
  handlePlaneOAuthCallback(
    encodedIntegrationState: string
  ): Promise<{ response: OAuthTokenResponse; state: OAuthState; redirectUri?: string }> {
    throw new Error("Method not implemented.");
  }
  handleRedirectToPlaneOAuth(code: string, state: string): Promise<{ stateBuffer: string; redirectUri?: string }> {
    throw new Error("Method not implemented.");
  }

  getAuthUrl(state: OAuthState): string {
    const sentryAuthState: SentryAuthState = {
      userId: state.user_id,
      workspaceId: state.workspace_id,
      workspaceSlug: state.workspace_slug,
      planeAppInstallationId: state.plane_app_installation_id || "",
    };

    return this.sentryAuth.getInstallationUrl(sentryAuthState);
  }

  async handleCallback(
    code: string,
    state: string,
    additionalParams: Record<string, string>
  ): Promise<{ response: OAuthTokenResponse; state: OAuthState; redirectUri?: string }> {
    const sentryAuthState: SentryAuthState = JSON.parse(Buffer.from(state as string, "base64").toString());
    const installationId = additionalParams.installationId;
    const org = additionalParams.orgSlug;

    if (
      !sentryAuthState.userId ||
      !sentryAuthState.workspaceId ||
      !sentryAuthState.workspaceSlug ||
      !sentryAuthState.planeAppInstallationId ||
      !installationId ||
      !org
    ) {
      throw new Error(E_SILO_ERROR_CODES.INVALID_QUERY_PARAMS.toString());
    }

    const authData = await this.sentryAuth.getAccessToken(installationId, code);

    const response: OAuthTokenResponse = {
      access_token: authData.token,
      refresh_token: authData.refreshToken,
      expires_in: authData.expiresAt ? new Date(authData.expiresAt).getTime() - new Date().getTime() : 0,
      connection_id: installationId,
      connection_slug: org,
    };

    return {
      response,
      state: {
        workspace_id: sentryAuthState.workspaceId,
        workspace_slug: sentryAuthState.workspaceSlug,
        user_id: sentryAuthState.userId,
        target_host: sentryAuthState.workspaceSlug,
        plane_app_installation_id: sentryAuthState.planeAppInstallationId,
      },
    };
  }

  /*--------------- Unsupported methods ---------------*/
  isUserConnectionSupported(): boolean {
    return false;
  }
  getUserAuthUrl(state: OAuthState): string {
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
  /*--------------- Unsupported methods ---------------*/
}
