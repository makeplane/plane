import axios, { AxiosError } from "axios";
import {
  SlackAuthConfig,
  SlackAuthPayload,
  SlackBotTokenResponse,
  SlackAuthState,
  SlackUserTokenResponse,
  SlackUserAuthState,
  SlackUserAuthPayload,
  SlackTokenRefreshResponse,
} from "../types";
import { getUserAuthScopes, getWorkspaceAuthScopes } from "../helpers";

export class SlackAuthService {
  config: SlackAuthConfig;

  constructor(config: SlackAuthConfig) {
    this.config = config;
  }

  getWorkspaceAuthUrl(state: SlackAuthState): string {
    const scopes = getWorkspaceAuthScopes();
    const stateString = JSON.stringify(state);
    const encodedState = Buffer.from(stateString).toString("base64");
    return `https://slack.com/oauth/v2/authorize?scope=${scopes}&redirect_uri=${this.config.team_redirect_uri}&state=${encodedState}&client_id=${this.config.clientId}`;
  }

  getUserAuthUrl(state: SlackAuthState): string {
    const scopes = getUserAuthScopes();
    const stateString = JSON.stringify(state);
    const encodedState = Buffer.from(stateString).toString("base64");
    return `https://slack.com/oauth/v2/authorize?user_scope=${scopes}&redirect_uri=${this.config.user_redirect_uri}&state=${encodedState}&client_id=${this.config.clientId}`;
  }

  async getWorkspaceAuthToken(payload: SlackAuthPayload): Promise<{
    response: SlackBotTokenResponse;
    state: SlackAuthState;
  }> {
    const { code, state } = payload;

    const url = "https://slack.com/api/oauth.v2.access";

    const formData = new FormData();
    formData.append("client_id", this.config.clientId);
    formData.append("client_secret", this.config.clientSecret);
    formData.append("redirect_uri", this.config.team_redirect_uri);
    formData.append("code", code);

    try {
      const { data: response } = await axios.post(url, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return { response, state: state as SlackAuthState };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        throw new Error(
          `HTTP error! status: ${axiosError.response?.status}, message: ${axiosError.message}`,
        );
      }
      throw error;
    }
  }

  async getUserAuthToken(payload: SlackUserAuthPayload): Promise<{
    response: SlackUserTokenResponse;
    state: SlackUserAuthState;
  }> {
    const { code, state } = payload;

    const url = "https://slack.com/api/oauth.v2.access";

    const formData = new FormData();
    formData.append("client_id", this.config.clientId);
    formData.append("client_secret", this.config.clientSecret);
    formData.append("redirect_uri", this.config.user_redirect_uri);
    formData.append("code", code);

    try {
      const { data: response } = await axios.post(url, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return { response, state: state as SlackUserAuthState };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        throw new Error(
          `HTTP error! status: ${axiosError.response?.status}, message: ${axiosError.message}`,
        );
      }
      throw error;
    }
  }

  async refreshToken(
    refreshToken: string,
  ): Promise<SlackTokenRefreshResponse> {
    const url = "https://slack.com/api/oauth.v2.access";

    const formData = new FormData();
    formData.append("client_id", this.config.clientId);
    formData.append("client_secret", this.config.clientSecret);
    formData.append("refresh_token", refreshToken);
    formData.append("grant_type", "refresh_token");

    try {
      const { data: response } = await axios.post(url, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return response;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        throw new Error(
          `HTTP error! status: ${axiosError.response?.status}, message: ${axiosError.message}`,
        );
      }
      throw error;
    }
  }
}
