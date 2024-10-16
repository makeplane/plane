import { GithubAuthConfig, GithubAuthorizeState, GithubAuthPayload, TokenResponse } from "@/types";
import axios from "axios";

export class GithubAuthService {
  config: GithubAuthConfig;

  constructor(config: GithubAuthConfig) {
    this.config = config;
  }

  /**
   * Generates the authorization URL for Github OAuth
   * @param state The state object to be passed to Github
   * @returns The full authorization URL as a string
   */
  getAuthUrl(state: GithubAuthorizeState): string {
    const stateString = JSON.stringify(state);
    return `https://github.com/apps/${this.config.appName}/installations/select_target?state=${stateString}`;
  }

  /**
   * Exchanges the authorization code for an access token
   * @param payload An object containing the authorization code and state
   * @returns A promise that resolves to an object containing the token response and state
   */
  async getAccessToken(payload: GithubAuthPayload): Promise<{
    response: TokenResponse;
    state: GithubAuthorizeState;
  }> {
    const { code, state } = payload;

    const data = {
      code,
      redirect_uri: this.config.callbackUrl,
    };

    const { data: response } = await axios.post(this.config.tokenUrl, data);
    return { response, state };
  }

  /**
   * Refreshes an existing access token using a refresh token
   * @param refresh_token The refresh token to use for obtaining a new access token
   * @returns A promise that resolves to the new token response
   */
  async getRefreshToken(refresh_token: string): Promise<TokenResponse> {
    const data = {
      refresh_token: refresh_token,
      grant_type: "refresh_token",
    };

    const { data: response } = await axios.post(this.config.tokenUrl, data);

    return response;
  }
}
