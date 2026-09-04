/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import { API_BASE_URL } from "@plane/constants";
import type {
  TAIAccount,
  TAIAccountCreatePayload,
  TAIAccountUpdatePayload,
  TAIScopePolicy,
  TAIScopePolicyInput,
} from "@plane/types";
import { APIService } from "@/services/api.service";

export class AIAccountService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async fetchAIAccountsList(workspaceSlug: string): Promise<TAIAccount[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/ai-accounts/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createAIAccount(workspaceSlug: string, data: TAIAccountCreatePayload): Promise<TAIAccount & { token: string }> {
    return this.post(`/api/workspaces/${workspaceSlug}/ai-accounts/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateAIAccount(workspaceSlug: string, accountId: string, data: TAIAccountUpdatePayload): Promise<TAIAccount> {
    return this.patch(`/api/workspaces/${workspaceSlug}/ai-accounts/${accountId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteAIAccount(workspaceSlug: string, accountId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/ai-accounts/${accountId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async fetchAIScopes(workspaceSlug: string, accountId: string): Promise<TAIScopePolicy[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/ai-accounts/${accountId}/scopes/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateAIScopes(
    workspaceSlug: string,
    accountId: string,
    scopes: TAIScopePolicyInput[]
  ): Promise<TAIScopePolicy[]> {
    return this.put(`/api/workspaces/${workspaceSlug}/ai-accounts/${accountId}/scopes/`, { scopes })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

export const aiAccountService = new AIAccountService();
