/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL } from "@plane/constants";
import type { IApiToken, IServiceAccessToken, IServiceAccessTokenCreate } from "@plane/types";
import { APIService } from "../api.service";

export class APITokenService extends APIService {
  constructor(BASE_URL?: string) {
    super(BASE_URL || API_BASE_URL);
  }

  /**
   * Retrieves all API tokens for a specific workspace
   * @returns {Promise<IApiToken[]>} Array of API tokens associated with the workspace
   * @throws {Error} Throws response data if the request fails
   */
  async list(): Promise<IApiToken[]> {
    return this.get(`/api/users/api-tokens/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Retrieves a specific API token by its ID
   * @param {string} tokenId - The unique identifier of the API token
   * @returns {Promise<IApiToken>} The requested API token's details
   * @throws {Error} Throws response data if the request fails
   */
  async retrieve(tokenId: string): Promise<IApiToken> {
    return this.get(`/api/users/api-tokens/${tokenId}`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Creates a new API token for a workspace
   * @param {Partial<IApiToken>} data - The data for creating the new API token
   * @returns {Promise<IApiToken>} The newly created API token
   * @throws {Error} Throws response data if the request fails
   */
  async create(data: Partial<IApiToken>): Promise<IApiToken> {
    return this.post(`/api/users/api-tokens/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Deletes a specific API token from the workspace
   * @param {string} tokenId - The unique identifier of the API token to delete
   * @returns {Promise<IApiToken>} The deleted API token's details
   * @throws {Error} Throws response data if the request fails
   */
  async destroy(tokenId: string): Promise<IApiToken> {
    return this.delete(`/api/users/api-tokens/${tokenId}`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

export class ServiceAccessTokenService extends APIService {
  constructor(BASE_URL?: string) {
    super(BASE_URL || API_BASE_URL);
  }

  async listWorkspace(workspaceSlug: string): Promise<IServiceAccessToken[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/service-tokens/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createWorkspace(workspaceSlug: string, data: IServiceAccessTokenCreate): Promise<IServiceAccessToken> {
    return this.post(`/api/workspaces/${workspaceSlug}/service-tokens/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateWorkspace(
    workspaceSlug: string,
    tokenId: string,
    data: Partial<IServiceAccessTokenCreate>
  ): Promise<IServiceAccessToken> {
    return this.patch(`/api/workspaces/${workspaceSlug}/service-tokens/${tokenId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async revokeWorkspace(workspaceSlug: string, tokenId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/service-tokens/${tokenId}/`)
      .then(() => undefined)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async listInstance(): Promise<IServiceAccessToken[]> {
    return this.get("/api/instances/service-tokens/")
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createInstance(data: IServiceAccessTokenCreate): Promise<IServiceAccessToken> {
    return this.post("/api/instances/service-tokens/", data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateInstance(tokenId: string, data: Partial<IServiceAccessTokenCreate>): Promise<IServiceAccessToken> {
    return this.patch(`/api/instances/service-tokens/${tokenId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async revokeInstance(tokenId: string): Promise<void> {
    return this.delete(`/api/instances/service-tokens/${tokenId}/`)
      .then(() => undefined)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
