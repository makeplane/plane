import axios, { AxiosInstance, AxiosError } from "axios";
import { logger } from "@plane/logger";
import { TWorkspaceCredential } from "@plane/types";
import { env } from "@/env";
import { getTokenCacheKey } from "@/helpers/cache-keys";
import { integrationConnectionHelper } from "@/helpers/integration-connection-helper";
import {
  PlaneOAuthTokenOptions,
  PlaneOAuthTokenResponse,
  EOAuthGrantType as PlaneOAuthGrantType,
  PlaneOAuthAppInstallation,
} from "@/types/oauth";
import { Store } from "@/worker/base";

/**
 * Plane OAuth Service
 * This service is responsible for interacting with the Plane OAuth API
 */
class PlaneOAuthService {
  private baseURL: string;
  private axiosInstance: AxiosInstance;
  private store: Store;

  constructor() {
    this.baseURL = `${env.API_BASE_URL}/auth/o`;
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
    });
    this.store = Store.getInstance();
    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response) {
          logger.error("OAuth request failed:", error.response.data);
          throw new Error("OAuth request failed");
        }
        throw error;
      }
    );
  }

  /**
   * Generate a token from the OAuth service based on the grant type
   * It accepts tokenOptions and returns a token response, also checks in cache first
   * @param tokenOptions - The options for the token request (client_id, client_secret, grant_type, code, code_verifier)
   * @returns The token response | PlaneOAuthTokenResponse
   */
  async generateToken(tokenOptions: PlaneOAuthTokenOptions): Promise<PlaneOAuthTokenResponse> {
    try {
      const { client_id, client_secret, grant_type, code, code_verifier, app_installation_id, redirect_uri, user_id } =
        tokenOptions;

      if (!client_id || !client_secret || !grant_type || !app_installation_id) {
        throw new Error("Client ID, Client Secret, Grant Type, and App Installation ID are required");
      }

      let tokenResponse: PlaneOAuthTokenResponse;
      let cacheKey: string;
      switch (grant_type) {
        case PlaneOAuthGrantType.AUTHORIZATION_CODE: {
          if (!code || !redirect_uri) {
            throw new Error("Code and Redirect URI are required for authorization code grant type");
          }
          tokenResponse = await this.getAuthorizationCodeToken(
            client_id,
            client_secret,
            code,
            redirect_uri,
            code_verifier
          );
          cacheKey = getTokenCacheKey(app_installation_id, grant_type, user_id);
          break;
        }

        case PlaneOAuthGrantType.CLIENT_CREDENTIALS: {
          if (!app_installation_id) {
            throw new Error("App Installation ID is required for client credentials grant type");
          }
          tokenResponse = await this.getClientCredentialsToken(client_id, client_secret, app_installation_id);
          cacheKey = getTokenCacheKey(app_installation_id, grant_type);
          break;
        }

        default:
          throw new Error(`Unsupported grant type: ${grant_type}`);
      }

      await this.setTokenInCache(cacheKey, tokenResponse);

      return tokenResponse;
    } catch (error) {
      logger.error("Get token failed:", error);
      throw error;
    }
  }

  async getOAuthToken(
    credential: TWorkspaceCredential,
    appClientId: string,
    appClientSecret: string
  ): Promise<PlaneOAuthTokenResponse> {
    // check if the token is in the cache if not make a request to the api based on the authorization type
    // store the token in the cache and in the database
    // return the token

    if (!credential.target_identifier || !credential.target_authorization_type) {
      throw new Error("Target Identifier or Target Authorization Type not available for the credential");
    }

    const cacheKey = getTokenCacheKey(
      credential.target_identifier,
      credential.target_authorization_type as PlaneOAuthGrantType,
      credential.user_id
    );
    const token = await this.store.get(cacheKey);
    if (token) {
      return JSON.parse(token) as PlaneOAuthTokenResponse;
    }

    switch (credential.target_authorization_type) {
      case PlaneOAuthGrantType.AUTHORIZATION_CODE: {
        if (!credential.target_refresh_token) {
          throw new Error("Refresh Token not available for the credential for authorization code grant type");
        }
        const tokenResponse = await this.getAccessTokenFromRefreshToken(
          credential.target_refresh_token,
          appClientId,
          appClientSecret
        );
        await this.setTokenInCache(cacheKey, tokenResponse);
        await integrationConnectionHelper.updateWorkspaceCredential({
          credential_id: credential.id,
          target_access_token: tokenResponse.access_token,
          target_refresh_token: tokenResponse.refresh_token,
        });
        return tokenResponse;
      }

      case PlaneOAuthGrantType.CLIENT_CREDENTIALS: {
        const tokenResponse = await this.getClientCredentialsToken(
          appClientId,
          appClientSecret,
          credential.target_identifier
        );
        await this.setTokenInCache(cacheKey, tokenResponse);
        await integrationConnectionHelper.updateWorkspaceCredential({
          credential_id: credential.id,
          target_access_token: tokenResponse.access_token,
        });
        return tokenResponse;
      }

      default:
        throw new Error(`Unsupported authorization type: ${credential.target_authorization_type}`);
    }
  }

  /**
   * Get a token from the OAuth service based on the refresh token
   * @param refreshToken - The refresh token
   * @param clientId - The client ID
   * @param clientSecret - The client secret
   * @returns The token response | PlaneOAuthTokenResponse
   */
  async getAccessTokenFromRefreshToken(
    refreshToken: string,
    clientId: string,
    clientSecret: string
  ): Promise<PlaneOAuthTokenResponse> {
    try {
      const data = new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
      });

      const response = await this.axiosInstance.post(`${this.baseURL}/token/`, data, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Cache-Control": "no-cache",
        },
      });

      return response.data;
    } catch (error) {
      logger.error("Refresh token request failed:", error);
      throw error;
    }
  }

  /**
   * Get a Plane OAuth redirect URL
   * @param clientId - The client ID
   * @param redirectUri - The redirect URI
   * @param state - The state in base64 encoded string
   * @returns The Plane OAuth redirect URL something like this: https://api.plane.so/oauth/authorize-app/?client_id=123&response_type=code&redirect_uri=https://example.com/callback&state=123
   */
  getPlaneOAuthRedirectUrl(clientId: string, redirectUri: string, state: string): string {
    try {
      const data = new URLSearchParams({
        client_id: clientId,
        response_type: "code",
        redirect_uri: redirectUri,
        state: state,
      });

      return `${this.baseURL}/authorize-app/?${data.toString()}`;
    } catch (error) {
      logger.error("Failed to generate OAuth redirect URL:", error);
      throw error;
    }
  }

  async deleteTokenFromCache(credential: TWorkspaceCredential) {
    try {
      if (!credential.target_identifier || !credential.target_authorization_type || !credential.user_id) {
        logger.error("Skipping deletion of token from cache for credential:", credential.id);
        return;
      }
      const cacheKey = getTokenCacheKey(
        credential.target_identifier,
        credential.target_authorization_type as PlaneOAuthGrantType,
        credential.user_id
      );
      await this.store.del(cacheKey);
    } catch (error) {
      logger.error("Failed to delete token from cache:", error);
      throw error;
    }
  }

  async getAppInstallation(token: string, appInstallationId: string): Promise<PlaneOAuthAppInstallation> {
    try {
      const response = await this.axiosInstance.get(`${this.baseURL}/app-installation/?id=${appInstallationId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data?.[0];
    } catch (error) {
      logger.error("Failed to get app installations:", error);
      throw error;
    }
  }

  // sets the token in the cache with a TTL of 80% of the token's expiration time
  private async setTokenInCache(cacheKey: string, tokenResponse: PlaneOAuthTokenResponse) {
    await this.store.set(cacheKey, JSON.stringify(tokenResponse), tokenResponse.expires_in * 0.8);
  }

  /**
   * Get a basic auth token
   * @param clientId - The client ID
   * @param clientSecret - The client secret
   * @returns The basic auth token
   */
  private getBasicAuthToken(clientId: string, clientSecret: string) {
    try {
      return Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    } catch (error) {
      logger.error("Failed to generate basic auth token:", error);
      throw new Error("Failed to generate authentication token");
    }
  }

  /**
   * Get a client credentials token
   * @param clientId - The client ID
   * @param clientSecret - The client secret
   * @param appInstallationId - The app installation ID
   * @returns The client credentials token | PlaneOAuthTokenResponse
   */
  private async getClientCredentialsToken(clientId: string, clientSecret: string, appInstallationId: string) {
    try {
      const data = new URLSearchParams({
        grant_type: "client_credentials",
        app_installation_id: appInstallationId,
      });
      const response = await this.axiosInstance.post(`${this.baseURL}/token/`, data, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${this.getBasicAuthToken(clientId, clientSecret)}`,
          "Cache-Control": "no-cache",
        },
      });

      return response.data;
    } catch (error) {
      logger.error("Client credentials token request failed:", error);
      throw error;
    }
  }

  /**
   * Get a authorization code token
   * @param clientId - The client ID
   * @param clientSecret - The client secret
   * @param code - The authorization code
   * @returns The authorization code token | PlaneOAuthTokenResponse
   */
  private async getAuthorizationCodeToken(
    clientId: string,
    clientSecret: string,
    code: string,
    redirectUri: string,
    codeVerifier?: string
  ) {
    try {
      const data = new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        ...(codeVerifier && { code_verifier: codeVerifier }),
      });

      const response = await this.axiosInstance.post(`${this.baseURL}/token/`, data, {
        headers: {
          "Cache-Control": "no-cache",
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      return response.data;
    } catch (error) {
      logger.error("Authorization code token request failed:", error);
      throw error;
    }
  }
}

export const planeOAuthService = new PlaneOAuthService();
