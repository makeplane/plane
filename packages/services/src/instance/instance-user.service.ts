/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL } from "@plane/constants";
import type { IUser, TInstanceUserPaginationInfo } from "@plane/types";
import { APIService } from "../api.service";

export class InstanceUserService extends APIService {
  constructor(BASE_URL?: string) {
    super(BASE_URL || API_BASE_URL);
  }

  async list(nextPageCursor?: string): Promise<TInstanceUserPaginationInfo> {
    return this.get("/api/instances/users/", {
      params: { cursor: nextPageCursor },
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async update(userId: string, data: { is_active: boolean }): Promise<IUser> {
    return this.patch(`/api/instances/users/${userId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
