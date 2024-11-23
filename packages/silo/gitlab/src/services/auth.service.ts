import axios from "axios";
import {
  GitLabAuthConfig,
  GitLabAuthorizeState,
  GitLabAuthPayload,
  GitLabTokenResponse,
} from "../types/auth";

const DEFAULT_SCOPES = [
  "api",
  "read_api",
  "read_user",
  "read_repository",
  "profile",
  "email",
];

export class GitLabAuthService {
  config: GitLabAuthConfig;
  scopes: string[];

  constructor(config: GitLabAuthConfig, scopes: string[] = DEFAULT_SCOPES) {
    this.config = config;
    this.scopes = scopes;
  }

  private getScopesString(): string {
    return encodeURIComponent(this.scopes.join(" "));
  }

  /**
   * Generates the authorization URL for GitLab OAuth
   * @param state The state object to be passed to GitLab
   * @returns The full authorization URL as a string
   */
  getAuthUrl(state: GitLabAuthorizeState): string {
    const stateString = JSON.stringify(state);
    const encodedState = Buffer.from(stateString).toString("base64");
    let hostname = this.config.host || "gitlab.com";
    return `https://${hostname}/oauth/authorize?client_id=${this.config.clientId}&redirect_uri=${this.config.redirectUri}&response_type=code&state=${encodedState}&scope=${this.getScopesString()}`;
  }

  /**
   * Exchanges the authorization code for an access token
   * @param payload An object containing the authorization code and state
   * @returns A promise that resolves to an object containing the token response and state
   */
  async getAccessToken(payload: GitLabAuthPayload): Promise<{
    response: GitLabTokenResponse;
    state: GitLabAuthorizeState;
  }> {
    const { code, state } = payload;

    const { data: response } = await axios.post<GitLabTokenResponse>(
      "https://gitlab.com/oauth/token",
      {
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: this.config.redirectUri,
      },
    );

    const decodedState = JSON.parse(
      Buffer.from(state, "base64").toString(),
    ) as GitLabAuthorizeState;

    return { response, state: decodedState };
  }
}
