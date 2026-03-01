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
// types
import type { SentryAuthState, TSentryConfig, TSentryConnectionData } from "@plane/etl/sentry";
import type { TWorkspaceConnection } from "@plane/types";

export class SentryIntegrationService {
  protected baseURL: string;
  private axiosInstance: AxiosInstance;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.axiosInstance = axios.create({ baseURL, withCredentials: true });
  }

  /**
   * @description get the app installation url
   * @param { SlackAuthState } payload
   * @returns { Promise<string> }
   */
  async getAppInstallationURL(payload: SentryAuthState): Promise<string> {
    return this.axiosInstance
      .post(`/api/oauth/sentry/auth/url`, {
        plane_app_installation_id: payload.planeAppInstallationId,
        workspace_id: payload.workspaceId,
        workspace_slug: payload.workspaceSlug,
        user_id: payload.userId,
      })
      .then((res) => {
        if (res.status === 200) {
          return res.data;
        }
        throw new Error(res.data.message);
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description get the app connection status
   * @param { string } workspaceId
   * @returns { Promise<TAppConnection[]> }
   */
  async getAppConnection(workspaceId: string): Promise<TWorkspaceConnection<TSentryConfig, TSentryConnectionData>[]> {
    return this.axiosInstance
      .get(`/api/oauth/sentry/auth/organization-status/${workspaceId}`)
      .then((res) => {
        if (res.status === 200) {
          return res.data;
        }
        throw new Error(res.data.message);
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description disconnect the app
   * @param { string } workspaceId
   * @param { string } connectionId
   * @returns { Promise<void> }
   */
  async disconnectApp(workspaceId: string, connectionId: string): Promise<string> {
    return this.axiosInstance
      .post(`/api/sentry/app/disconnect`, { workspaceId, connectionId })
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description get plane app details
   * @returns { Promise<{ appId: string; clientId: string }> }
   */
  getPlaneAppDetails = async (): Promise<{ appId: string; clientId: string }> =>
    await this.axiosInstance
      .get(`/api/oauth/sentry/plane-app-details`)
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });

  /**
   * @description get the app connection status
   * @param { string } workspaceId
   * @returns { Promise<TAppConnection[]> }
   */
  async updateAppConnection(
    workspaceId: string,
    connectionId: string,
    connection: TWorkspaceConnection<TSentryConfig, TSentryConnectionData>
  ): Promise<TWorkspaceConnection<TSentryConfig, TSentryConnectionData>[]> {
    return this.axiosInstance
      .post(`/api/sentry/app/update`, { workspaceId, connectionId, connection })
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
