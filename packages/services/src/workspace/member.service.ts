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
import type { IWorkspaceMember } from "@plane/types";
import { APIService } from "../api.service";

/**
 * Service class for managing workspace members
 * Handles operations related to workspace membership, including member information,
 * updates, deletions, and role management
 * @extends {APIService}
 */
export class WorkspaceMemberService extends APIService {
  /**
   * Creates an instance of WorkspaceMemberService
   * @param {string} baseUrl - The base URL for API requests
   */
  constructor(BASE_URL?: string) {
    super(BASE_URL || API_BASE_URL);
  }

  /**
   * Retrieves all members of a specific workspace
   * @param {string} workspaceSlug - The unique slug identifier for the workspace
   * @returns {Promise<IWorkspaceMember[]>} Promise resolving to array of workspace members
   * @throws {Error} If the API request fails
   */
  async list(workspaceSlug: string): Promise<IWorkspaceMember[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/members/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Updates a workspace member's information
   * @param {string} workspaceSlug - The unique slug identifier for the workspace
   * @param {string} memberId - The unique identifier for the member
   * @param {Partial<IWorkspaceMember>} data - Updated member data
   * @returns {Promise<IWorkspaceMember>} Promise resolving to the updated member information
   * @throws {Error} If the API request fails
   */
  async update(workspaceSlug: string, memberId: string, data: Partial<IWorkspaceMember>): Promise<IWorkspaceMember> {
    return this.patch(`/api/workspaces/${workspaceSlug}/members/${memberId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Removes a member from a workspace
   * @param {string} workspaceSlug - The unique slug identifier for the workspace
   * @param {string} memberId - The unique identifier for the member to remove
   * @returns {Promise<any>} Promise resolving to the deletion response
   * @throws {Error} If the API request fails
   */
  async destroy(workspaceSlug: string, memberId: string): Promise<any> {
    return this.delete(`/api/workspaces/${workspaceSlug}/members/${memberId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
