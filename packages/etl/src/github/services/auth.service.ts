import { GithubAuthConfig, GithubAuthorizeState, GithubUserAuthPayload, GithubUserAuthState } from "@/github/types";
import axios from "axios";

export type GithubTokenResponse = {
  access_token: string;
  scope: string;
};

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
    const encodedState = Buffer.from(stateString).toString("base64");
    return `https://github.com/apps/${this.config.appName}/installations/select_target?state=${encodedState}`;
  }

  getUserAuthUrl(state: GithubUserAuthState): string {
    const stateString = JSON.stringify(state);
    const encodedState = Buffer.from(stateString).toString("base64");
    return `https://github.com/login/oauth/authorize?client_id=${this.config.clientId}&redirect_uri=${this.config.callbackUrl}&state=${encodedState}`;
  }

  /**
   * Exchanges the authorization code for an access token
   * @param payload An object containing the authorization code and state
   * @returns A promise that resolves to an object containing the token response and state
   */
  async getUserAccessToken(payload: GithubUserAuthPayload): Promise<{
    response: string;
    state: GithubUserAuthState;
  }> {
    const { code, state } = payload;

    const { data: response } = await axios.post("https://github.com/login/oauth/access_token", {
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      code,
    });
    return { response, state };
  }
}
