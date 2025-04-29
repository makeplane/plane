import axios, { AxiosInstance, AxiosError } from "axios";
import { env } from "@/env";
import { logger } from "@/logger";
import { PlaneOAuthTokenOptions, PlaneOAuthTokenResponse } from "@/types";

class PlaneOAuthService {
  private baseURL: string;
  private axiosInstance: AxiosInstance;

  constructor() {
    this.baseURL = encodeURIComponent(`${env.API_BASE_URL}/o`);
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
    });

    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response) {
          logger.error('OAuth request failed:', error.response.data);
          throw new Error('OAuth request failed');
        }
        throw error;
      }
    );
  }


  /**
   * Get a token from the OAuth service based on the grant type
   * It accepts tokenOptions and returns a token response, also checks in cache first
   * @param tokenOptions - The options for the token request (client_id, client_secret, grant_type, code, code_verifier)
   * @returns The token response | PlaneOAuthTokenResponse
   */
  async getToken(tokenOptions: PlaneOAuthTokenOptions): Promise<PlaneOAuthTokenResponse> {
    try {
      const { client_id, client_secret, grant_type, code, code_verifier } = tokenOptions;

      if (!client_id || !client_secret || !grant_type) {
        throw new Error("Client ID, Client Secret, and Grant Type are required");
      }

      switch (grant_type) {
        // TODO: make a redis cache for the oauth token and retrieve it from there else make a request to the api
        case "authorization_code":
          if (!code) {
            throw new Error("Code is required for authorization code grant type");
          }
          return this.getAuthorizationCodeToken(client_id, client_secret, code, code_verifier);

        case "client_credentials":
          return this.getClientCredentialsToken(client_id, client_secret);

        default:
          throw new Error(`Unsupported grant type: ${grant_type}`);
      }
    } catch (error) {
      logger.error('Get token failed:', error);
      throw error;
    }
  }


  /**
   * Get a token from the OAuth service based on the refresh token
   * @param refreshToken - The refresh token
   * @returns The token response | PlaneOAuthTokenResponse
   */
  async getAccessTokenFromRefreshToken(refreshToken: string): Promise<PlaneOAuthTokenResponse> {
    try {
      const data = new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      });

      const response = await this.axiosInstance.post(`${this.baseURL}/token`, data, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Cache-Control": "no-cache",
        },
      });

      return response.data;
    } catch (error) {
      logger.error('Refresh token request failed:', error);
      throw error;
    }
  }

  /**
   * Get a Plane OAuth redirect URL
   * @param clientId - The client ID
   * @param redirectUri - The redirect URI
   * @param state - The state
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
      logger.error('Failed to generate OAuth redirect URL:', error);
      throw error;
    }
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
      logger.error('Failed to generate basic auth token:', error);
      throw new Error('Failed to generate authentication token');
    }
  }

  /**
   * Get a client credentials token
   * @param clientId - The client ID
   * @param clientSecret - The client secret
   * @returns The client credentials token | PlaneOAuthTokenResponse
   */
  private async getClientCredentialsToken(clientId: string, clientSecret: string) {
    try {
      const data = new URLSearchParams({
        grant_type: "client_credentials",
      });

      const response = await this.axiosInstance.post(`${this.baseURL}/token`, data, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization": `Basic ${this.getBasicAuthToken(clientId, clientSecret)}`,
          "Cache-Control": "no-cache",
        },
      });

      return response.data;
    } catch (error) {
      logger.error('Client credentials token request failed:', error);
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
  private async getAuthorizationCodeToken(clientId: string, clientSecret: string, code: string, codeVerifier?: string) {
    try {
      const data = new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        client_id: clientId,
        client_secret: clientSecret,
        ...(codeVerifier && { code_verifier: codeVerifier }),
      });

      const response = await this.axiosInstance.post(`${this.baseURL}/token`, data, {
        headers: {
          "Cache-Control": "no-cache",
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      return response.data;
    } catch (error) {
      logger.error('Authorization code token request failed:', error);
      throw error;
    }
  }

}

export default new PlaneOAuthService();