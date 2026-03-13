/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL } from "@plane/constants";
import type { IWorkspace, TWorkspacePaginationInfo } from "@plane/types";

export interface IWorkspaceBulkCreateResponse {
  created: IWorkspace[];
  skipped: Array<{ row_number: number; name: string; slug: string; reason: string }>;
  total_created: number;
  total_skipped: number;
}

export interface IWorkspaceBulkAssignResponse {
  assigned: Array<{ email: string; workspace_slug: string; role: number }>;
  skipped: Array<{ row_number: number; email: string; workspace_slug: string; reason: string }>;
  total_assigned: number;
  total_skipped: number;
}
import { APIService } from "../api.service";

/**
 * Service class for managing instance workspaces
 * Handles CRUD operations on instance workspaces
 * @extends APIService
 */
export class InstanceWorkspaceService extends APIService {
  /**
   * Constructor for InstanceWorkspaceService
   * @param BASE_URL - Base URL for API requests
   */
  constructor(BASE_URL?: string) {
    super(BASE_URL || API_BASE_URL);
  }

  /**
   * Retrieves a paginated list of workspaces for the current instance
   * @param {string} nextPageCursor - Optional cursor to retrieve the next page of results
   * @returns {Promise<TWorkspacePaginationInfo>} Promise resolving to a paginated list of workspaces
   * @throws {Error} If the API request fails
   */
  async list(nextPageCursor?: string): Promise<TWorkspacePaginationInfo> {
    return this.get(`/api/instances/workspaces/`, {
      params: {
        cursor: nextPageCursor,
      },
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Checks if a workspace slug is available
   * @param {string} slug - The workspace slug to check
   * @returns {Promise<any>} Promise resolving to slug availability status
   * @throws {Error} If the API request fails
   */
  async slugCheck(slug: string): Promise<any> {
    const params = new URLSearchParams({ slug });
    return this.get(`/api/instances/workspace-slug-check/?${params.toString()}`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Creates a new workspace
   * @param {Partial<IWorkspace>} data - Workspace data for creation
   * @returns {Promise<IWorkspace>} Promise resolving to the created workspace
   * @throws {Error} If the API request fails
   */
  async create(data: Partial<IWorkspace>): Promise<IWorkspace> {
    return this.post("/api/instances/workspaces/", data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Bulk creates workspaces from a parsed array. Slug is auto-generated on the backend.
   * @param workspaces - Array of workspace objects with name and optional organization_size
   * @returns Promise resolving to created/skipped summary
   */
  async bulkCreate(
    workspaces: Array<{ name: string; organization_size?: string }>
  ): Promise<IWorkspaceBulkCreateResponse> {
    return this.post("/api/instances/workspaces/bulk-create/", { workspaces })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async bulkAssignMembers(
    members: Array<{ email: string; workspace_slug: string; role: number }>
  ): Promise<IWorkspaceBulkAssignResponse> {
    return this.post("/api/instances/workspaces/bulk-assign-members/", { members })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async destroy(workspaceSlug: string): Promise<void> {
    return this.delete(`/api/instances/workspaces/${workspaceSlug}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
