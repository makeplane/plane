/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import axios from "axios";
import type { GitLabAuthConfig, GitLabAuthorizeState, GitLabAuthPayload, GitLabTokenResponse } from "../types/auth";

const DEFAULT_SCOPES = ["api", "read_api", "read_user", "read_repository", "profile", "email"];

export class GitLabAuthService {
  config: GitLabAuthConfig;
  scopes: string[];
  baseUrl: string;

  constructor(config: GitLabAuthConfig, scopes: string[] = DEFAULT_SCOPES) {
    this.config = config;
    this.scopes = scopes;
    this.baseUrl = config.baseUrl || "https://gitlab.com";
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
    return `${this.baseUrl}/oauth/authorize?client_id=${this.config.clientId}&redirect_uri=${this.config.redirectUri}&response_type=code&state=${encodedState}&scope=${this.getScopesString()}`;
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

    const { data: response } = await axios.post<GitLabTokenResponse>(`${this.baseUrl}/oauth/token`, {
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: this.config.redirectUri,
    });

    const decodedState = JSON.parse(Buffer.from(state, "base64").toString()) as GitLabAuthorizeState;

    return { response, state: decodedState };
  }
}
