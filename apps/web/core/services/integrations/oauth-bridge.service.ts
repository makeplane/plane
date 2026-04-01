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

import { API_BASE_URL } from "@plane/constants";
import { APIService } from "@/services/api.service";

export interface IExternalTokenProvider {
  id: string;
  name: string;
  is_enabled: boolean;
  issuer: string;
  audience: string[];
  jwks_url: string;
  allowed_algorithms: string[];
  user_claim: string;
  jwks_cache_ttl: number;
  rate_limit: string | null;
  created_at: string;
  updated_at: string;
}

export type IExternalTokenProviderPayload = Omit<IExternalTokenProvider, "id" | "created_at" | "updated_at">;

export class OAuthBridgeService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async listProviders(workspaceSlug: string): Promise<IExternalTokenProvider[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/oauth-bridge/providers/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async getProvider(workspaceSlug: string, providerId: string): Promise<IExternalTokenProvider> {
    return this.get(`/api/workspaces/${workspaceSlug}/oauth-bridge/providers/${providerId}/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async createProvider(workspaceSlug: string, data: IExternalTokenProviderPayload): Promise<IExternalTokenProvider> {
    return this.post(`/api/workspaces/${workspaceSlug}/oauth-bridge/providers/`, data)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async updateProvider(
    workspaceSlug: string,
    providerId: string,
    data: Partial<IExternalTokenProviderPayload>
  ): Promise<IExternalTokenProvider> {
    return this.patch(`/api/workspaces/${workspaceSlug}/oauth-bridge/providers/${providerId}/`, data)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async deleteProvider(workspaceSlug: string, providerId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/oauth-bridge/providers/${providerId}/`)
      .then(() => undefined)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async testProvider(workspaceSlug: string, providerId: string): Promise<{ success: boolean; message: string }> {
    return this.post(`/api/workspaces/${workspaceSlug}/oauth-bridge/providers/${providerId}/test/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }
}
