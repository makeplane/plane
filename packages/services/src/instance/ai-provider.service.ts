/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL } from "@plane/constants";
import type {
  IAIModelProfile,
  IAIProviderConnectionTestResult,
  IAIProviderDraftTestPayload,
  IAIProviderProfile,
  TAIProviderCreate,
  TAIProviderUpdate,
} from "@plane/types";

import { APIService } from "../api.service";

export class AIProviderService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async list(): Promise<IAIProviderProfile[]> {
    return this.get("/api/instances/ai/providers/")
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async importLegacy(): Promise<IAIProviderProfile> {
    return this.post("/api/instances/ai/import-legacy/")
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async create(data: TAIProviderCreate): Promise<IAIProviderProfile> {
    return this.post("/api/instances/ai/providers/", data)
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async update(id: string, data: TAIProviderUpdate): Promise<IAIProviderProfile> {
    return this.patch(`/api/instances/ai/providers/${id}/`, data)
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async destroy(id: string): Promise<void> {
    return this.delete(`/api/instances/ai/providers/${id}/`)
      .then(() => undefined)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async setDefault(id: string): Promise<IAIProviderProfile> {
    return this.post(`/api/instances/ai/providers/${id}/set-default/`)
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async testConnection(id: string, model?: string): Promise<IAIProviderConnectionTestResult> {
    return this.post(`/api/instances/ai/providers/${id}/test-connection/`, model ? { model } : {})
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Probes a provider configuration that has not been saved yet, so the admin can
   * verify the credentials before the first write. Nothing is persisted.
   */
  async testDraftConnection(data: IAIProviderDraftTestPayload): Promise<IAIProviderConnectionTestResult> {
    return this.post("/api/instances/ai/providers/test-connection/", data)
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async listModels(id: string): Promise<IAIModelProfile[]> {
    return this.get(`/api/instances/ai/providers/${id}/models/`)
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createModel(id: string, data: Partial<IAIModelProfile>): Promise<IAIModelProfile> {
    return this.post(`/api/instances/ai/providers/${id}/models/`, data)
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async discoverModels(id: string): Promise<{ success: boolean; models?: string[]; error_code?: string }> {
    return this.post(`/api/instances/ai/providers/${id}/models/discover/`)
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateModel(id: string, modelId: string, data: Partial<IAIModelProfile>): Promise<IAIModelProfile> {
    return this.patch(`/api/instances/ai/providers/${id}/models/${encodeURIComponent(modelId)}/`, data)
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
