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
import type { TServiceAuthConfiguration } from "@plane/etl/core";
import { E_IMPORTER_KEYS } from "@plane/etl/core";

export class FlatfileAuthService {
  protected baseURL: string;
  private axiosInstance: AxiosInstance;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.axiosInstance = axios.create({ baseURL, withCredentials: true });
  }

  /**
   * @description validate the CSV importer is authenticated or not
   * @param { string } workspaceId
   * @param { string } userId
   * @returns { Promise<void | undefined> }
   */
  async csvAuthVerification(workspaceId: string, userId: string): Promise<TServiceAuthConfiguration | undefined> {
    return this.axiosInstance
      .get(`/api/credentials/${workspaceId}/${userId}/?source=${E_IMPORTER_KEYS.FLATFILE}`)
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description Save CSV credentials
   * @param { string } workspaceId
   * @param { string } userId
   * @param { string } externalApiToken
   * @returns { Promise<void> }
   */
  async saveCredentials(workspaceId: string, userId: string, externalApiToken: string): Promise<void> {
    return this.axiosInstance
      .post(`/api/flatfile/credentials/save`, {
        workspaceId,
        userId,
        externalApiToken,
      })
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description Register webhook
   * @returns { Promise<void> }
   */
  async registerWebhook(): Promise<void> {}
}
