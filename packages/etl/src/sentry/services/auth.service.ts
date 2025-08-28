import axios from "axios";
import { SentryAuthConfig, SentryAuthState, SentryAuthTokenResponse } from "../types";

/**
 * Service for handling Sentry OAuth authentication flows.
 */
export class SentryAuthService {
  /** Configuration object containing Sentry integration details */
  config: SentryAuthConfig

  /**
   * @param config - Sentry integration configuration
   */
  constructor(config: SentryAuthConfig) {
    this.config = config;
  }

  /**
   * Generates installation URL for OAuth flow with base64-encoded state.
   *
   * @param state - Authentication state to preserve during OAuth
   * @returns Installation URL with encoded state parameter
   */
  getInstallationUrl(state: SentryAuthState) {
    const stateString = JSON.stringify(state);
    const encodedState = Buffer.from(stateString).toString("base64");
    return `${this.config.baseUrl}/sentry-apps/${this.config.integrationSlug}/external-install/?state=${encodedState}`
  }

  /**
   * Exchanges authorization code for access token.
   *
   * @param installationId - Sentry app installation ID
   * @param code - Authorization code from OAuth callback
   * @returns Token response with access token
   */
  async getAccessToken(installationId: string, code: string): Promise<SentryAuthTokenResponse> {
    const url = `${this.config.baseUrl}/api/0/sentry-app-installations/${installationId}/authorizations/`
    const payload = {
      code,
      grant_type: "authorization_code",
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
    }

    const response = await axios.post(url, payload);
    return response.data;
  }

  /**
   * Refreshes expired access token using refresh token.
   *
   * @param installationId - Sentry app installation ID
   * @param refreshToken - Valid refresh token
   * @returns New token response
   */
  async getRefreshToken(installationId: string, refreshToken: string): Promise<SentryAuthTokenResponse> {
    const url = `${this.config.baseUrl}/api/0/sentry-app-installations/${installationId}/authorizations/`
    const payload = {
      refresh_token: refreshToken,
      grant_type: "refresh_token",
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
    }

    const response = await axios.post(url, payload);
    return response.data;
  }
}
