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
import type { TInstanceUserListParams, TInstanceUserListResponse, TInstanceAdminCreatePayload } from "@plane/types";
import { APIService } from "../api.service";

class InstanceUserService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async list(params: TInstanceUserListParams): Promise<TInstanceUserListResponse> {
    return this.get("/api/instances/users/", { params })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async create(data: TInstanceAdminCreatePayload): Promise<{ message: string }> {
    return this.post("/api/instances/users/", data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async destroy(userId: string): Promise<void> {
    return this.delete(`/api/instances/users/${userId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateRole(userId: string, data: { role: "admin" | "user" }): Promise<{ message: string }> {
    return this.patch(`/api/instances/users/${userId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async resetPassword(data: { new_password: string }): Promise<void> {
    return this.post("/api/instances/admins/reset-password/", data)
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

export const instanceUserService = new InstanceUserService();
