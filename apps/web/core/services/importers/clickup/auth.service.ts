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
import type { TClickUpAuthState } from "@plane/etl/clickup";
import type { TServiceAuthConfiguration } from "@plane/etl/core";
import { E_IMPORTER_KEYS } from "@plane/etl/core";

export class ClickUpAuthService {
  protected baseURL: string;
  private axiosInstance: AxiosInstance;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.axiosInstance = axios.create({ baseURL, withCredentials: true });
  }

  /**
   * @description validate the jira importer is authenticated or not
   * @param { string } workspaceId
   * @param { string } userId
   * @returns { Promise<void | undefined> }
   */
  async clickUpAuthVerification(workspaceId: string, userId: string): Promise<TServiceAuthConfiguration | undefined> {
    return this.axiosInstance
      .get(`/api/credentials/${workspaceId}/${userId}/?source=${E_IMPORTER_KEYS.CLICKUP}`)
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description authenticate the service via PAT
   * @property payload: JiraPATAuthState
   * @returns the authenticated user details
   * @returns { Promise<void | undefined> }
   */
  async clickUpPATAuthentication(payload: TClickUpAuthState): Promise<void | undefined> {
    return this.axiosInstance
      .post(`/api/clickup/auth/pat`, payload)
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description deactivates the jira importer auth
   * @param { string } workspaceId
   * @param { string } userId
   * @returns { Promise<void | undefined> }
   */
  async clickUpAuthDeactivate(workspaceId: string, userId: string): Promise<void | undefined> {
    return this.axiosInstance
      .post(`/api/credentials/${workspaceId}/${userId}/deactivate/?source=${E_IMPORTER_KEYS.CLICKUP}`)
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description get plane app details
   * @returns { Promise<{ appId: string; clientId: string }> }
   */
  getPlaneClickUpAppDetails = async (): Promise<{ appId: string; clientId: string }> =>
    await this.axiosInstance
      .get(`/api/plane-app-details/${E_IMPORTER_KEYS.IMPORTER}`)
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
}
