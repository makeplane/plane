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
import type {
  BitbucketAuthConfig,
  BitbucketAuthorizeState,
  BitbucketOAuthConfig,
  BitbucketTokenResponse,
  BitbucketUser,
} from "../types";
import { createBitbucketService } from "./api.service";

export class BitbucketAuthService {
  constructor(public readonly config: BitbucketAuthConfig) {}

  async validateToken(baseUrl: string, token: string): Promise<BitbucketUser> {
    if (!baseUrl || !token) {
      throw new Error("Bitbucket baseUrl and personal access token are required for validation");
    }

    const service = createBitbucketService(baseUrl, token);
    return service.getCurrentUser();
  }
}

export const createBitbucketAuth = (config: BitbucketAuthConfig): BitbucketAuthService => {
  if (!config.baseUrl) {
    throw new Error("Bitbucket baseUrl is required");
  }

  return new BitbucketAuthService(config);
};

const BITBUCKET_OAUTH_SCOPES = "REPO_ADMIN PROJECT_ADMIN";

export const encodeOAuthState = (state: BitbucketAuthorizeState): string =>
  encodeURIComponent(Buffer.from(JSON.stringify(state)).toString("base64"));

export const decodeOAuthState = (state: string): BitbucketAuthorizeState => {
  const normalizedState = decodeURIComponent(state).replace(/ /g, "+");
  return JSON.parse(Buffer.from(normalizedState, "base64").toString()) as BitbucketAuthorizeState;
};

export class BitbucketOAuthService {
  constructor(public readonly config: BitbucketOAuthConfig) {}

  getAuthUrl(state: BitbucketAuthorizeState): string {
    const encodedState = encodeOAuthState(state);
    const baseUrl = this.config.baseUrl.replace(/\/+$/, "");
    return `${baseUrl}/rest/oauth2/latest/authorize?client_id=${encodeURIComponent(this.config.clientId)}&redirect_uri=${encodeURIComponent(this.config.redirectUri)}&response_type=code&scope=${encodeURIComponent(BITBUCKET_OAUTH_SCOPES)}&state=${encodedState}`;
  }

  async getAccessToken(payload: {
    code: string;
    state: string;
  }): Promise<{ response: BitbucketTokenResponse; state: BitbucketAuthorizeState }> {
    const { code, state } = payload;
    const baseUrl = this.config.baseUrl.replace(/\/+$/, "");

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: this.config.redirectUri,
    });

    const { data: response } = await axios.post<BitbucketTokenResponse>(
      `${baseUrl}/rest/oauth2/latest/token`,
      params.toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const decodedState = decodeOAuthState(state);

    return { response, state: decodedState };
  }

  async refreshToken(refreshToken: string): Promise<BitbucketTokenResponse> {
    const baseUrl = this.config.baseUrl.replace(/\/+$/, "");

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
      redirect_uri: this.config.redirectUri,
    });

    const { data } = await axios.post<BitbucketTokenResponse>(
      `${baseUrl}/rest/oauth2/latest/token`,
      params.toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    return data;
  }
}

export const createBitbucketOAuth = (config: BitbucketOAuthConfig): BitbucketOAuthService => {
  if (!config.baseUrl || !config.clientId || !config.clientSecret) {
    throw new Error("Bitbucket baseUrl, clientId, and clientSecret are required for OAuth");
  }
  return new BitbucketOAuthService(config);
};
