/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL } from "@plane/constants";
import type { TInstanceAgent, TInstanceAgentPayload } from "@plane/types";
import { APIService } from "../api.service";

/**
 * Instance-admin CRUD for the agent registry (`/api/instances/agents/`).
 *
 * `env` values come back masked. On update, send `env` only when it changed, as the complete
 * desired set, with the mask for every value to keep.
 */
export class InstanceAgentService extends APIService {
  constructor(BASE_URL?: string) {
    super(BASE_URL || API_BASE_URL);
  }

  async list(): Promise<TInstanceAgent[]> {
    return this.get("/api/instances/agents/")
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async retrieve(agentId: string): Promise<TInstanceAgent> {
    return this.get(`/api/instances/agents/${agentId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async create(data: TInstanceAgentPayload): Promise<TInstanceAgent> {
    return this.post("/api/instances/agents/", data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async update(agentId: string, data: TInstanceAgentPayload): Promise<TInstanceAgent> {
    return this.patch(`/api/instances/agents/${agentId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async destroy(agentId: string): Promise<void> {
    return this.delete(`/api/instances/agents/${agentId}/`)
      .then(() => undefined)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
