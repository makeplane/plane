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
import { SILO_BASE_PATH, SILO_BASE_URL } from "@plane/constants";
import type { TExtensions } from "@plane/editor";
import type { E_INTEGRATION_KEYS } from "@plane/types";

interface IEnabledIntegration {
  connection_provider: TExtensions;
}

export class SiloAppService {
  protected baseURL: string;
  private axiosInstance: AxiosInstance;

  constructor() {
    this.baseURL = encodeURI(SILO_BASE_URL + SILO_BASE_PATH);
    this.axiosInstance = axios.create({ baseURL: this.baseURL, withCredentials: true });
  }

  async getSupportedIntegrations(): Promise<E_INTEGRATION_KEYS[]> {
    return this.axiosInstance
      .get(`/api/supported-integrations/`)
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
  async getEnabledIntegrations(workspaceId: string): Promise<IEnabledIntegration[]> {
    return this.axiosInstance
      .get(`/api/apps/${workspaceId}/enabled-integrations/`)
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
