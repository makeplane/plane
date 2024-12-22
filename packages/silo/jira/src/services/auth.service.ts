import { JiraAuthProps, JiraAuthState } from "@/types";
import axios from "axios";
import { JIRA_SCOPES } from "../helpers";

export type JiraTokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
};

export class JiraAuth {
  props: JiraAuthProps;

  constructor(props: JiraAuthProps) {
    this.props = props;
  }

  getCallbackUrl(hostname: string): string {
    // return this.props.callbackURL;
    // remove the / at the end of the hostname
    const host = hostname.endsWith("/") ? hostname.slice(0, -1) : hostname;
    return host + this.props.callbackURL;
  }

  getAuthorizationURL(state: JiraAuthState, hostname: string): string {
    const scope = JIRA_SCOPES.join(" ");
    const callbackURL = this.getCallbackUrl(hostname);
    const stateString = JSON.stringify(state);
    const encodedState = Buffer.from(stateString).toString("base64");
    const consentURL = `${this.props.authorizeURL}?client_id=${this.props.clientId}&redirect_uri=${callbackURL}&access_type=offline&response_type=code&scope=${scope}&state=${encodedState || ""}`;
    return consentURL;
  }

  async getAccessToken(
    code: string,
    state: JiraAuthState,
    hostname: string,
  ): Promise<{ tokenResponse: JiraTokenResponse; state: JiraAuthState }> {
    const data = {
      code,
      client_id: this.props.clientId,
      client_secret: this.props.clientSecret,
      redirect_uri: this.getCallbackUrl(hostname),
      grant_type: "authorization_code",
    };

    const { data: tokenResponse } = await axios.post(this.props.tokenURL, data);
    return { tokenResponse, state };
  }

  async getRefreshToken(refreshToken: string): Promise<JiraTokenResponse> {
    const data = {
      client_id: this.props.clientId,
      client_secret: this.props.clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    };

    const { data: response } = await axios.post(
      "https://auth.atlassian.com/oauth/token",
      data,
    );
    return response as JiraTokenResponse;
  }
}
