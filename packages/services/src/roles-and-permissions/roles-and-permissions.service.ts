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
import { API_BASE_URL } from "@plane/constants";
import type {
  CreateRolePayload,
  CurrentUserPermissionState,
  PermissionNamespace,
  PermissionRole,
  PermissionScheme,
  PermissionSchemeImpact,
  UpdateRolePayload,
} from "@plane/types";
// local imports
import { APIService } from "../api.service";

/**
 * Permission Service
 *
 * Handles all permission-related API calls for the new RBAC + GAC system.
 */
export class RolesAndPermissionsService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  /**
   * Retrieves the list of roles for a specific workspace
   * @param {string} workspaceSlug - The unique slug for the workspace
   * @param {PermissionNamespace} namespace - The namespace for the roles
   * @returns {Promise<PermissionRole[]>} Promise resolving to a list of roles
   * @throws {Error} If the API request fails
   */
  async listRoles(workspaceSlug: string, namespace: PermissionNamespace): Promise<PermissionRole[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/roles/`, {
      params: {
        namespace,
      },
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Creates a specific role within a workspace
   * @param {string} workspaceSlug - The unique slug for the workspace
   * @param {Partial<PermissionRole>} data - Partial role data to update
   * @returns {Promise<PermissionRole>} Promise resolving to the updated role data
   * @throws {Error} If the API request fails
   */
  async createRole(workspaceSlug: string, data: CreateRolePayload): Promise<PermissionRole> {
    return this.post(`/api/workspaces/${workspaceSlug}/roles/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Updates a specific role within a workspace
   * @param {string} workspaceSlug - The unique slug for the workspace
   * @param {string} roleId - The unique identifier for the role
   * @param {Partial<PermissionRole>} data - Partial role data to update
   * @returns {Promise<PermissionRole>} Promise resolving to the updated role data
   * @throws {Error} If the API request fails
   */
  async updateRole(workspaceSlug: string, roleId: string, data: UpdateRolePayload): Promise<PermissionRole> {
    return this.patch(`/api/workspaces/${workspaceSlug}/roles/${roleId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Deletes a specific role within a workspace
   * @param {string} workspaceSlug - The unique slug for the workspace
   * @param {string} roleId - The unique identifier for the role
   * @returns {Promise<void>} Promise resolving when the role is deleted
   * @throws {Error} If the API request fails
   */
  async destroyRole(workspaceSlug: string, roleId: string, reassignTo?: string): Promise<void> {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/roles/${roleId}/`,
      reassignTo ? { reassign_to: reassignTo } : undefined
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Retrieves the current user's permissions for a workspace
   * @param {string} workspaceSlug - The unique slug for the workspace
   * @returns {Promise<CurrentUserPermissionState>} Promise resolving to the current user's permissions for the workspace
   * @throws {Error} If the API request fails
   */
  async retrieveWorkspacePermissions(workspaceSlug: string): Promise<CurrentUserPermissionState> {
    return this.get(`/api/workspaces/${workspaceSlug}/permissions/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  /**
   * Retrieves the list of permission schemes for a specific workspace
   * @param {string} workspaceSlug - The unique slug for the workspace
   * @param {PermissionNamespace} [namespace] - Optional namespace to filter schemes
   * @returns {Promise<PermissionScheme[]>} Promise resolving to a list of permission schemes
   * @throws {Error} If the API request fails
   */
  async listPermissionSchemes(workspaceSlug: string, namespace?: PermissionNamespace): Promise<PermissionScheme[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/permission-schemes/`, {
      params: namespace ? { namespace } : undefined,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Creates a permission scheme within a workspace
   * @param {string} workspaceSlug - The unique slug for the workspace
   * @param {Partial<PermissionScheme> & { namespace: PermissionNamespace }} data - Permission scheme data to create
   * @returns {Promise<PermissionScheme>} Promise resolving to the created permission scheme
   * @throws {Error} If the API request fails
   */
  async createPermissionScheme(
    workspaceSlug: string,
    data: Partial<PermissionScheme> & { namespace: PermissionNamespace }
  ): Promise<PermissionScheme> {
    return this.post(`/api/workspaces/${workspaceSlug}/permission-schemes/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Updates a specific permission scheme within a workspace
   * @param {string} workspaceSlug - The unique slug for the workspace
   * @param {string} schemeId - The unique identifier for the permission scheme
   * @param {Partial<PermissionScheme>} data - Partial permission scheme data to update
   * @returns {Promise<PermissionScheme>} Promise resolving to the updated permission scheme
   * @throws {Error} If the API request fails
   */
  async updatePermissionScheme(
    workspaceSlug: string,
    schemeId: string,
    data: Partial<PermissionScheme>
  ): Promise<PermissionScheme> {
    return this.patch(`/api/workspaces/${workspaceSlug}/permission-schemes/${schemeId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Deletes a specific permission scheme within a workspace
   * @param {string} workspaceSlug - The unique slug for the workspace
   * @param {string} schemeId - The unique identifier for the permission scheme
   * @returns {Promise<void>} Promise resolving when the permission scheme is deleted
   * @throws {Error} If the API request fails
   */
  async destroyPermissionScheme(workspaceSlug: string, schemeId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/permission-schemes/${schemeId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Retrieves the impact analysis for a specific permission scheme
   * @param {string} workspaceSlug - The unique slug for the workspace
   * @param {string} schemeId - The unique identifier for the permission scheme
   * @returns {Promise<PermissionSchemeImpact>} Promise resolving to the impact analysis data
   * @throws {Error} If the API request fails
   */
  async getPermissionSchemeImpact(workspaceSlug: string, schemeId: string): Promise<PermissionSchemeImpact> {
    return this.get(`/api/workspaces/${workspaceSlug}/permission-schemes/${schemeId}/impact/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
