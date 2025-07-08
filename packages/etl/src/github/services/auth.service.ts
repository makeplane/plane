import axios from "axios";
import {
  GithubAuthConfig,
  GithubAuthorizeState,
  GithubEnterpriseAuthConfig,
  GithubUserAuthPayload,
  GithubUserAuthState,
} from "@/github/types";

export type GithubTokenResponse = {
  access_token: string;
  scope: string;
};

export interface GithubAuthServiceBase {
  config: GithubAuthConfig | GithubEnterpriseAuthConfig;
  baseGithubUrl: string;

  getAuthUrl(state: GithubAuthorizeState): string;
  getUserAuthUrl(state: GithubUserAuthState): string;
  getUserAccessToken(payload: GithubUserAuthPayload): Promise<{
    response: string;
    state: GithubUserAuthState;
  }>;
}

export class GithubAuthService implements GithubAuthServiceBase {
  config: GithubAuthConfig;
  baseGithubUrl: string;

  constructor(config: GithubAuthConfig) {
    this.config = config;
    this.baseGithubUrl = "https://github.com";
  }

  /**
   * Generates the authorization URL for Github OAuth
   * @param state The state object to be passed to Github
   * @returns The full authorization URL as a string
   */
  getAuthUrl(state: GithubAuthorizeState): string {
    const stateString = JSON.stringify(state);
    const encodedState = Buffer.from(stateString).toString("base64");
    return `${this.baseGithubUrl}/apps/${this.config.appName}/installations/select_target?state=${encodedState}`;
  }

  getUserAuthUrl(state: GithubUserAuthState): string {
    const stateString = JSON.stringify(state);
    const encodedState = Buffer.from(stateString).toString("base64");
    return `${this.baseGithubUrl}/login/oauth/authorize?client_id=${this.config.clientId}&redirect_uri=${this.config.callbackUrl}&state=${encodedState}`;
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

    const { data: response } = await axios.post(`${this.baseGithubUrl}/login/oauth/access_token`, {
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      code,
    });
    return { response, state };
  }
}

export class GithubEnterpriseAuthService extends GithubAuthService {
  constructor(config: GithubEnterpriseAuthConfig) {
    super(config);
    this.baseGithubUrl = config.baseGithubUrl;
  }

  getAuthUrl(state: GithubAuthorizeState): string {
    const stateString = JSON.stringify(state);
    const encodedState = Buffer.from(stateString).toString("base64");
    return `${this.baseGithubUrl}/github-apps/${this.config.appName}/installations/select_target?state=${encodedState}`;
  }
}
