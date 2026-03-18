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

import type { AxiosInstance } from "axios";
import axios from "axios";
import type { TBitbucketWorkspaceConnection } from "@plane/types";

export class BitbucketOAuthService {
  protected baseURL: string;
  private axiosInstance: AxiosInstance;

  constructor(baseURL: string) {
    this.baseURL = `${baseURL}/api/oauth/bitbucket-dc`;
    this.axiosInstance = axios.create({ baseURL: this.baseURL, withCredentials: true });
  }

  fetchAppConfigKey = async (
    workspaceId: string,
    config: { baseUrl: string; clientId: string; clientSecret: string; webhookSecret?: string }
  ): Promise<{ configKey: string }> =>
    await this.axiosInstance
      .post(`/auth/config-key/${workspaceId}`, { config })
      .then((res) => res.data as { configKey: string })
      .catch((error: unknown) => {
        throw (error as { response?: { data?: unknown } })?.response?.data;
      });

  getAuthUrl = async (payload: {
    workspace_id: string;
    workspace_slug: string;
    user_id: string;
    plane_api_token: string;
    plane_app_installation_id?: string;
    config_key: string;
  }): Promise<string> =>
    await this.axiosInstance
      .post(`/auth/url`, payload)
      .then((res) => res.data as string)
      .catch((error: unknown) => {
        throw (error as { response?: { data?: unknown } })?.response?.data;
      });

  fetchOrganizationConnection = async (workspaceId: string): Promise<TBitbucketWorkspaceConnection[] | undefined> =>
    await this.axiosInstance
      .get(`/auth/organization-status/${workspaceId}`)
      .then((res) => res.data as TBitbucketWorkspaceConnection[])
      .catch((error: unknown) => {
        throw (error as { response?: { data?: unknown } })?.response?.data;
      });

  disconnectOrganization = async (workspaceId: string, connectionId: string, userId: string): Promise<void> =>
    await this.axiosInstance
      .post(`/auth/organization-disconnect/${workspaceId}/${encodeURIComponent(connectionId)}/${userId}`)
      .then((res) => res.data as void)
      .catch((error: unknown) => {
        throw (error as { response?: { data?: unknown } })?.response?.data;
      });

  getUserAuthUrl = async (payload: {
    workspace_id: string;
    workspace_slug: string;
    user_id: string;
    plane_api_token: string;
    profile_redirect?: boolean;
  }): Promise<string> =>
    await this.axiosInstance
      .post(`/auth/user/url`, payload)
      .then((res) => res.data as string)
      .catch((error: unknown) => {
        throw (error as { response?: { data?: unknown } })?.response?.data;
      });

  getPlaneAppDetails = async (): Promise<{ appId: string; clientId: string }> =>
    await this.axiosInstance
      .get(`/plane-app-details`)
      .then((res) => res.data as { appId: string; clientId: string })
      .catch((error: unknown) => {
        throw (error as { response?: { data?: unknown } })?.response?.data;
      });

  fetchUserConnection = async (workspaceId: string, userId: string): Promise<{ isConnected: boolean }> =>
    await this.axiosInstance
      .get(`/auth/user-status/${workspaceId}/${userId}`)
      .then((res) => res.data as { isConnected: boolean })
      .catch((error: unknown) => {
        throw (error as { response?: { data?: unknown } })?.response?.data;
      });

  disconnectUser = async (workspaceId: string, userId: string): Promise<void> =>
    await this.axiosInstance
      .post(`/auth/user-disconnect/${workspaceId}/${userId}`)
      .then((res) => res.data as void)
      .catch((error: unknown) => {
        throw (error as { response?: { data?: unknown } })?.response?.data;
      });
}
