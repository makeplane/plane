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
import type { GitLabAuthorizeState } from "@plane/etl/gitlab";
// plane web types
import type { TGitlabWorkspaceConnection, TGitlabAppConfig } from "@plane/types";

export class GitlabAuthService {
  protected baseURL: string;
  private axiosInstance: AxiosInstance;

  constructor(baseURL: string, isEnterprise: boolean = false) {
    this.baseURL = isEnterprise ? `${baseURL}/api/oauth/gitlab-enterprise` : `${baseURL}/api/gitlab`;
    this.axiosInstance = axios.create({ baseURL: this.baseURL, withCredentials: true });
  }

  /**
   * @description fetch organization
   * @param { string } workspaceId
   * @returns { Promise<TGitlabWorkspaceConnection[] | undefined> }
   */
  fetchOrganizationConnection = async (workspaceId: string): Promise<TGitlabWorkspaceConnection[] | undefined> =>
    await this.axiosInstance
      .get(`/auth/organization-status/${workspaceId}`)
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });

  /**
   * @description connect organization
   * @param { GitLabAuthorizeState } payload
   * @returns { Promise<string> }
   */
  connectOrganization = async (payload: GitLabAuthorizeState): Promise<string> =>
    await this.axiosInstance
      .post(`/auth/url`, payload)
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });

  /**
   * @description disconnect organization
   * @param { string } workspaceId
   * @param { string } organizationId
   * @param { string } userId
   * @returns { Promise<void> }
   */
  disconnectOrganization = async (workspaceId: string, organizationId: string, userId: string): Promise<void> =>
    await this.axiosInstance
      .post(`/auth/organization-disconnect/${workspaceId}/${organizationId}/${userId}`)
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });

  /**
   * @description get plane app details
   * @returns { Promise<{ appId: string; clientId: string }> }
   */
  getPlaneAppDetails = async (): Promise<{ appId: string; clientId: string }> =>
    await this.axiosInstance
      .get(`/plane-app-details`)
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });

  /**
   * @description fetch app config key
   * @param { string } workspaceId
   * @param { TGitlabAppConfig } config
   * @returns { Promise<string> }
   */
  fetchAppConfigKey = async (workspaceId: string, config: TGitlabAppConfig): Promise<{ configKey: string }> =>
    await this.axiosInstance
      .post(`/auth/config-key/${workspaceId}`, { config })
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
}
