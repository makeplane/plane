/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import { API_BASE_URL } from "@plane/constants";
import type { TAdminRole, TInstanceUser, TInstanceUserRoleResponse } from "@plane/types";
// api service
import { APIService } from "../api.service";

/**
 * Instance administrator surface for accounts and administrator tags.
 *
 * The three administrator tags (development, operations, main PI) are handed
 * out here and nowhere else.
 */
export class InstanceUserService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async list(
    params: { search?: string; role?: TAdminRole | ""; cursor?: string; isActive?: boolean; imported?: boolean } = {}
  ) {
    return this.get("/api/instances/users/", {
      params: {
        ...(params.search ? { search: params.search } : {}),
        ...(params.role ? { role: params.role } : {}),
        ...(params.cursor ? { cursor: params.cursor } : {}),
        ...(params.isActive !== undefined ? { is_active: String(params.isActive) } : {}),
        ...(params.imported !== undefined ? { imported: String(params.imported) } : {}),
      },
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deactivate(userId: string) {
    return this.delete(`/api/instances/users/${userId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async bulkDeactivate(userIds: string[]) {
    return this.post("/api/instances/users/bulk-deactivate/", { user_ids: userIds })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async clearImported(batchId?: string) {
    return this.post("/api/instances/users/clear-imported/", batchId ? { batch_id: batchId } : {})
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async reactivate(userId: string) {
    return this.post(`/api/instances/users/${userId}/reactivate/`, {})
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async roles(userId: string): Promise<TInstanceUserRoleResponse> {
    return this.get(`/api/instances/users/${userId}/roles/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async assignRole(userId: string, role: TAdminRole, note = ""): Promise<TInstanceUserRoleResponse> {
    return this.post(`/api/instances/users/${userId}/roles/`, { role, note })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async revokeRole(userId: string, role: TAdminRole): Promise<TInstanceUserRoleResponse> {
    return this.delete(`/api/instances/users/${userId}/roles/`, { role })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

export type { TInstanceUser };
