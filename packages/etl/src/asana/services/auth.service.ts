import axios from "axios";
// types
import { AsanaAuthProps, AsanaAuthState } from "@/asana/types";

export type AsanaTokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
};

export class AsanaAuth {
  props: AsanaAuthProps;

  constructor(props: AsanaAuthProps) {
    this.props = props;
  }

  getCallbackUrl(): string {
    return this.props.callbackURL;
  }

  getAuthorizationURL(state: AsanaAuthState): string {
    const scope = "default"; // Asana's scope
    const callbackURL = this.getCallbackUrl();
    const stateString = JSON.stringify(state);
    // encode state string to base64
    const encodedState = Buffer.from(stateString).toString("base64");
    const consentURL = `https://app.asana.com/-/oauth_authorize?scope=${scope}&response_type=code&client_id=${this.props.clientId}&redirect_uri=${callbackURL}&state=${encodedState}`;
    return consentURL;
  }

  async getAccessToken(
    code: string,
    state: AsanaAuthState
  ): Promise<{ tokenResponse: AsanaTokenResponse; state: AsanaAuthState }> {
    const params = new URLSearchParams();
    params.append("grant_type", "authorization_code");
    params.append("client_id", this.props.clientId);
    params.append("client_secret", this.props.clientSecret);
    params.append("redirect_uri", this.getCallbackUrl());
    params.append("code", code);

    const { data: tokenResponse } = await axios.post<AsanaTokenResponse>(
      "https://app.asana.com/-/oauth_token",
      params.toString()
    );
    return { tokenResponse, state };
  }

  async getRefreshToken(refreshToken: string): Promise<AsanaTokenResponse> {
    const params = new URLSearchParams();
    params.append("grant_type", "refresh_token");
    params.append("client_id", this.props.clientId);
    params.append("client_secret", this.props.clientSecret);
    params.append("refresh_token", refreshToken);

    const { data: tokenResponse } = await axios.post<AsanaTokenResponse>(
      "https://app.asana.com/-/oauth_token",
      params.toString()
    );
    return tokenResponse;
  }
}
