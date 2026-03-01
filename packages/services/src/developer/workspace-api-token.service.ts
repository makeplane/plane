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
import type { IApiToken } from "@plane/types";
import { APIService } from "../api.service";

/**
 * Service class for managing API tokens for a workspace
 * Handles CRUD operations for API tokens
 * @extends {APIService}
 */
export class WorkspaceAPITokenService extends APIService {
  constructor(BASE_URL?: string) {
    super(BASE_URL || API_BASE_URL);
  }

  /**
   * Retrieves all API tokens for a workspace
   * @param {string} workspaceSlug - The unique slug identifier for the workspace
   * @returns {Promise<IApiToken[]>} Promise resolving to array of API tokens
   * @throws {Error} If the API request fails
   */
  async list(workspaceSlug: string): Promise<IApiToken[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/api-tokens/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Retrieves details of a specific API token
   * @param {string} workspaceSlug - The unique slug identifier for the workspace
   * @param {string} tokenId - The unique identifier of the API token
   * @returns {Promise<IApiToken>} Promise resolving to API token details
   * @throws {Error} If the API request fails
   */
  async retrieve(workspaceSlug: string, tokenId: string): Promise<IApiToken> {
    return this.get(`/api/workspaces/${workspaceSlug}/api-tokens/${tokenId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Creates a new API token for a workspace
   * @param {string} workspaceSlug - The unique slug identifier for the workspace
   * @param {Partial<IApiToken>} data - API token configuration data
   * @returns {Promise<IApiToken>} Promise resolving to the created API token
   * @throws {Error} If the API request fails
   */
  async create(workspaceSlug: string, data: Partial<IApiToken>): Promise<IApiToken> {
    return this.post(`/api/workspaces/${workspaceSlug}/api-tokens/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Deletes a specific API token from the workspace
   * @param {string} workspaceSlug - The unique slug identifier for the workspace
   * @param {string} tokenId - The unique identifier of the API token
   * @returns {Promise<void>} Promise resolving when API token is deleted
   * @throws {Error} If the API request fails
   */
  async destroy(workspaceSlug: string, tokenId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/api-tokens/${tokenId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
