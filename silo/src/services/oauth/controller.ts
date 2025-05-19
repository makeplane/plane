import { Response } from "express";
import { E_INTEGRATION_KEYS, E_SILO_ERROR_CODES, E_INTEGRATION_ENTITY_CONNECTION_MAP } from "@plane/etl/core";
import { PlaneUser } from "@plane/sdk";
import { TWorkspaceConnection } from "@plane/types";
import { env } from "@/env";
import { integrationConnectionHelper } from "@/helpers/integration-connection-helper";
import { getPlaneAPIClient } from "@/helpers/plane-api-client";
import { planeOAuthService } from "./auth";
import { OAuthStrategyManager } from "./strategy-manager";
import { OAuthState, OAuthConnectionStatus, E_INTEGRATION_DISCONNECT_SOURCE, IntegrationUserMap } from "./types";

export class OAuthController {
  private strategyManager = OAuthStrategyManager.getInstance();

  async getAuthUrl(provider: E_INTEGRATION_KEYS, state: OAuthState): Promise<string> {
    const { workspace_id } = state;

    if (!workspace_id) {
      throw new Error("Bad Request, expected workspace_id, workspace_slug and plane_api_token be present.");
    }

    const connections = await integrationConnectionHelper.getWorkspaceConnections({
      workspace_id,
      connection_type: provider,
    });

    if (connections.length > 0) {
      // If the connection already exists, then we don't need to create it again
      throw new Error("Connection already exists");
    }

    const strategy = this.strategyManager.getStrategy(provider);
    return strategy.getAuthUrl(state);
  }

  async getUserAuthUrl(provider: E_INTEGRATION_KEYS, state: OAuthState): Promise<string> {
    const { workspace_id } = state;

    if (!workspace_id) {
      throw new Error("Bad Request, expected workspace_id, workspace_slug and plane_api_token be present.");
    }

    const strategy = this.strategyManager.getStrategy(provider);
    return strategy.getUserAuthUrl(state);
  }

  async handleCallback(provider: E_INTEGRATION_KEYS, code: string, state: string, res: Response): Promise<void> {
    try {
      const strategy = this.strategyManager.getStrategy(provider);
      const { response, state: authState, redirectUri } = await strategy.handleCallback(code, state);

      // Create or update workspace credentials
      const credential = await integrationConnectionHelper.createOrUpdateWorkspaceCredential({
        workspace_id: authState.workspace_id,
        user_id: authState.user_id,
        source: provider,
        source_access_token: response.access_token,
        source_refresh_token: response.refresh_token || "",
        target_access_token: authState.plane_api_token,
        source_hostname: authState.source_hostname || "",
        source_identifier: response.connection_id,
      });

      // Create new workspace connection
      await integrationConnectionHelper.createOrUpdateWorkspaceConnection({
        workspace_id: authState.workspace_id,
        connection_type: provider,
        target_hostname: authState.target_host || env.API_BASE_URL,
        connection_id: response.connection_id,
        connection_data: response.connection_data || {},
        credential_id: credential.id,
        connection_slug: response.connection_slug,
        config: {
          userMap: [],
        },
      });

      // Redirect to success page
      res.redirect(
        redirectUri ||
          `${env.APP_BASE_URL}/${authState.workspace_slug}/settings/integrations/${provider.toLowerCase()}/`
      );
    } catch (error: any) {
      // Handle specific error cases
      const redirectBase = `${env.APP_BASE_URL}/${JSON.parse(Buffer.from(state, "base64").toString()).workspace_slug}/settings/integrations/${provider.toLowerCase()}/`;

      if (error.message === E_SILO_ERROR_CODES.INVALID_INSTALLATION_ACCOUNT) {
        res.status(400).redirect(`${redirectBase}?error=${E_SILO_ERROR_CODES.INVALID_INSTALLATION_ACCOUNT}`);
        return;
      }

      if (error.message === E_SILO_ERROR_CODES.CONNECTION_NOT_FOUND) {
        res.status(400).redirect(`${redirectBase}?error=${E_SILO_ERROR_CODES.CONNECTION_NOT_FOUND}`);
        return;
      }

      // Generic error handling
      res.status(400).redirect(`${env.APP_BASE_URL}/error?error=${E_SILO_ERROR_CODES.GENERIC_ERROR}`);
    }
  }

  async handleUserAuthCallback(
    provider: E_INTEGRATION_KEYS,
    code: string,
    state: string,
    res: Response
  ): Promise<void> {
    try {
      const strategy = this.strategyManager.getStrategy(provider);
      const {
        response,
        state: authState,
        redirectUri: userRedirectUri,
      } = await strategy.handleUserCallback(code, state);

      const integrationUser = response.provider_user_data;

      let redirectUri = `${env.APP_BASE_URL}/${authState.workspace_slug}/settings/integrations/${provider.toLowerCase()}/`;

      if (authState.profile_redirect) {
        redirectUri = `${env.APP_BASE_URL}/profile/connections/?workspaceId=${authState.workspace_id}`;
      }

      if (userRedirectUri) {
        redirectUri = userRedirectUri;
      }

      const connections = await integrationConnectionHelper.getWorkspaceConnections({
        workspace_id: authState.workspace_id,
        connection_type: provider,
      });

      if (connections.length === 0) {
        throw new Error(E_SILO_ERROR_CODES.CONNECTION_NOT_FOUND.toString());
      }

      if (connections.length > 1) {
        throw new Error(E_SILO_ERROR_CODES.MULTIPLE_CONNECTIONS_FOUND.toString());
      }

      // Create credentials for Integration for the workspace
      await integrationConnectionHelper.createOrUpdateWorkspaceCredential({
        workspace_id: authState.workspace_id,
        user_id: authState.user_id,
        source: E_INTEGRATION_ENTITY_CONNECTION_MAP[provider],
        source_access_token: response.access_token,
        source_refresh_token: response.refresh_token || "",
        target_access_token: authState.plane_api_token,
        source_hostname: authState.source_hostname || "",
      });

      if (integrationUser) {
        const connection = connections[0] as TWorkspaceConnection<{ userMap: IntegrationUserMap }>;

        // get the credentials for the workspace or admin
        const credentials = await integrationConnectionHelper.getWorkspaceCredentials({
          workspace_id: authState.workspace_id,
          source: provider,
        });

        if (credentials.length === 0) {
          return res.redirect(`${redirectUri}?error=${E_SILO_ERROR_CODES.CONNECTION_NOT_FOUND}`);
        }

        const credential = credentials[0];
        if (!credential.source_access_token || !credential.target_access_token) {
          return res.redirect(`${redirectUri}?error=${E_SILO_ERROR_CODES.INSTALLATION_NOT_FOUND}`);
        }
        const planeClient = await getPlaneAPIClient(credential, provider);

        const users: PlaneUser[] = await planeClient.users.listAllUsers(authState.workspace_slug);
        const planeUser = users.find((user) => user.id === authState.user_id);

        // update the workspace connection for the user
        if (planeUser) {
          await integrationConnectionHelper.updateWorkspaceConnection({
            workspace_connection_id: connection.id,
            config: {
              userMap: [...(connection.config?.userMap || []), { integrationUser, planeUser }],
            },
          });
        }
      }

      res.redirect(redirectUri);
    } catch (error) {
      res.status(400).redirect(`${env.APP_BASE_URL}/error?error=${E_SILO_ERROR_CODES.GENERIC_ERROR}`);
    }
  }

  async getConnectionStatus(provider: E_INTEGRATION_KEYS, workspaceId: string): Promise<OAuthConnectionStatus> {
    const connections = await integrationConnectionHelper.getWorkspaceConnections({
      workspace_id: workspaceId,
      connection_type: provider,
    });

    return {
      isConnected: connections.length > 0,
      connections,
    };
  }

  async disconnectOrganization(provider: E_INTEGRATION_KEYS, workspaceId: string, connectionId: string): Promise<void> {
    const connection = await integrationConnectionHelper.getWorkspaceConnection({
      connection_type: provider,
      connection_id: connectionId,
      workspace_id: workspaceId,
    });

    if (!connection) return;

    const credential = await integrationConnectionHelper.getWorkspaceCredential({
      workspace_id: workspaceId,
      source: provider,
      credential_id: connection.credential_id,
    });

    const entityConnections = await integrationConnectionHelper.getWorkspaceEntityConnections({
      workspace_connection_id: connection.id,
    });

    const strategy = this.strategyManager.getStrategy(provider);
    await strategy.disconnectOrganization(connection, credential, entityConnections);

    // Delete the workspace connection
    await integrationConnectionHelper.deleteWorkspaceConnection({
      connection_id: connection.id,
      disconnect_meta: {
        disconnect_source: E_INTEGRATION_DISCONNECT_SOURCE.INTERNAL,
        disconnect_id: credential.source_access_token,
      },
    });

    // Delete the token from the cache
    await planeOAuthService.deleteTokenFromCache(credential);
  }

  async getUserConnectionStatus(
    provider: E_INTEGRATION_KEYS,
    workspaceId: string,
    userId: string
  ): Promise<OAuthConnectionStatus> {
    const credentials = await integrationConnectionHelper.getUserWorkspaceCredentials({
      workspace_id: workspaceId,
      user_id: userId,
      source: E_INTEGRATION_ENTITY_CONNECTION_MAP[provider],
    });

    return {
      isConnected: credentials.length > 0,
      connections: [],
    };
  }

  async disconnectUser(provider: E_INTEGRATION_KEYS, workspaceId: string, userId: string): Promise<void> {
    const credentials = await integrationConnectionHelper.getUserWorkspaceCredentials({
      workspace_id: workspaceId,
      user_id: userId,
      source: E_INTEGRATION_ENTITY_CONNECTION_MAP[provider],
    });

    if (!credentials.length) return;
    const credential = credentials[0];

    const connections = await integrationConnectionHelper.getWorkspaceConnections({
      connection_type: provider,
      workspace_id: workspaceId,
    });

    const connection = connections[0] as TWorkspaceConnection<{ userMap: IntegrationUserMap }>;

    const strategy = this.strategyManager.getStrategy(provider);
    await strategy.disconnectUser(connection, credential);

    // Remove the user mapping from the workspace connection
    const userMap = connection.config.userMap?.filter((map) => map.planeUser.id !== userId) || [];
    await integrationConnectionHelper.updateWorkspaceConnection({
      workspace_connection_id: connection.id,
      config: {
        userMap,
      },
    });

    await integrationConnectionHelper.deleteWorkspaceCredential(credentials[0].id);

    // Delete the token from the cache
    await planeOAuthService.deleteTokenFromCache(credentials[0]);
  }
}
