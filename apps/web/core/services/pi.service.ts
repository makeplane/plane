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

// plane imports
import { PI_URL } from "@plane/constants";
import type {
  TAIBlockTypesResponse,
  TAIBlockDetails,
  TAIBlockGenerateInput,
  TAIBlockRevisionTypesResponse,
  TFeedback,
  TDuplicateIssuePayload,
  TDuplicateIssueResponse,
} from "@plane/types";
// services
import { APIService } from "@/services/api.service";
import type { AxiosError, AxiosResponse } from "axios";
import type { TFeatureFlagsResponse } from "./feature-flag.service";

/**
 * Service class for handling PI-related API operations
 * Extends the base APIService class to interact with PI endpoints
 * @extends {APIService}
 */
export class PIService extends APIService {
  constructor() {
    super(PI_URL);
  }

  async getDuplicateIssues(data: Partial<TDuplicateIssuePayload>): Promise<TDuplicateIssueResponse> {
    return this.post(`/api/v1/dupes/issues/`, data)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async getPiFeatureFlag(workspaceSlug: string): Promise<TFeatureFlagsResponse> {
    return this.get(`/api/v1/flags/`, { params: { workspace_slug: workspaceSlug } })
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  /**
   * Fetches available AI block types
   * @returns {Promise<TAIBlockTypesResponse>} Promise resolving to AI block types
   * @throws {Error} If the API request fails
   */
  async getBlockTypes(): Promise<TAIBlockTypesResponse> {
    return this.get("/api/v1/pages/blocks/types/")
      .then((response: AxiosResponse<TAIBlockTypesResponse>) => response.data)
      .catch((error: AxiosError) => {
        throw error?.response?.data;
      });
  }

  /**
   * Fetches details of a specific AI block
   * @param {string} blockId - The unique identifier for the block
   * @returns {Promise<TAIBlockDetails>} Promise resolving to AI block details
   * @throws {Error} If the API request fails
   */
  async getBlockDetails(blockId: string): Promise<TAIBlockDetails> {
    return this.get(`/api/v1/pages/blocks/${blockId}/`)
      .then((response: AxiosResponse<TAIBlockDetails>) => response.data)
      .catch((error: AxiosError) => {
        throw error?.response?.data;
      });
  }

  async createBlock(data: { block_type: string; content: string | null }): Promise<TAIBlockDetails> {
    return this.post(`/api/v1/pages/blocks/`, data)
      .then((response: AxiosResponse<TAIBlockDetails>) => response.data)
      .catch((error: AxiosError) => {
        throw error?.response?.data;
      });
  }

  /**
   * Updates the details of a specific AI block
   * @param {string} blockId - The unique identifier for the block
   * @param {TAIBlockDetails} data - The data payload for the AI block
   * @returns {Promise<TAIBlockDetails>} Promise resolving to AI block details
   * @throws {Error} If the API request fails
   */
  async updateBlockDetails(
    blockId: string,
    data: { block_type: string; content: string | null }
  ): Promise<TAIBlockDetails> {
    return this.patch(`/api/v1/pages/blocks/${blockId}/`, data)
      .then((response: AxiosResponse<TAIBlockDetails>) => response.data)
      .catch((error: AxiosError) => {
        throw error?.response?.data;
      });
  }

  async generateBlockContent(data: TAIBlockGenerateInput): Promise<TAIBlockDetails> {
    return this.post(`/api/v1/pages/blocks/generate/`, data)
      .then((response: AxiosResponse<TAIBlockDetails>) => response.data)
      .catch((error: AxiosError) => {
        throw error?.response?.data;
      });
  }

  async getRevisionTypes(): Promise<TAIBlockRevisionTypesResponse> {
    return this.get("/api/v1/pages/blocks/revision/types/")
      .then((response: AxiosResponse<TAIBlockRevisionTypesResponse>) => response.data)
      .catch((error: AxiosError) => {
        throw error?.response?.data;
      });
  }

  async revisionBlockContent(data: { block_id: string; revision_type: string }): Promise<{
    success: boolean;
    revised_content: string;
  }> {
    return this.post(`/api/v1/pages/blocks/revision/`, data)
      .then((response: AxiosResponse<{ success: boolean; revised_content: string }>) => response.data)
      .catch((error: AxiosError) => {
        throw error?.response?.data;
      });
  }

  async postFeedback(
    data: TFeedback & {
      entity_type: string | undefined;
      entity_id: string | undefined;
      workspace_id: string | undefined;
    }
  ): Promise<{
    success: boolean;
  }> {
    return this.post(`/api/v1/feedback/${data.usage_type}/`, data)
      .then((response: AxiosResponse<{ success: boolean }>) => response.data)
      .catch((error: AxiosError) => {
        throw error?.response?.data;
      });
  }

  async listBlocks(pageId: string | undefined): Promise<{ blocks: TAIBlockDetails[] }> {
    return this.get(`/api/v1/pages/${pageId}/blocks/`)
      .then((response: AxiosResponse<{ blocks: TAIBlockDetails[] }>) => response.data)
      .catch((error: AxiosError) => {
        throw error?.response?.data;
      });
  }
}
