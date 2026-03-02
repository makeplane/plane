/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL } from "@plane/constants";
import { APIService } from "../api.service";

export interface IInstanceUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  display_name: string;
  avatar: string;
  is_active: boolean;
  date_joined: string;
  last_login: string | null;
  workspaces?: IInstanceUserWorkspace[];
}

export interface IInstanceUserWorkspace {
  id: string;
  workspace: string;
  workspace_name: string;
  workspace_slug: string;
  role: number;
  is_active: boolean;
  created_at: string;
}

export interface IInstanceUserPaginatedResponse {
  results: IInstanceUser[];
  total_count: number;
  total_pages: number;
  next_cursor: string;
  prev_cursor: string;
  next_page_results: boolean;
  prev_page_results: boolean;
}

export class InstanceUserService extends APIService {
  constructor(BASE_URL?: string) {
    super(BASE_URL || API_BASE_URL);
  }

  async list(params?: { search?: string; cursor?: string }): Promise<IInstanceUserPaginatedResponse> {
    return this.get("/api/instances/users/", { params })
      .then((res) => res?.data as IInstanceUserPaginatedResponse)
      .catch((err: { response?: { data: unknown } }) => {
        throw err?.response?.data;
      });
  }

  async create(data: {
    first_name: string;
    last_name?: string;
    email: string;
    password: string;
  }): Promise<IInstanceUser> {
    return this.post("/api/instances/users/", data)
      .then((res) => res?.data as IInstanceUser)
      .catch((err: { response?: { data: unknown } }) => {
        throw err?.response?.data;
      });
  }

  async detail(userId: string): Promise<IInstanceUser> {
    return this.get(`/api/instances/users/${userId}/`)
      .then((res) => res?.data as IInstanceUser)
      .catch((err: { response?: { data: unknown } }) => {
        throw err?.response?.data;
      });
  }

  async update(
    userId: string,
    data: Partial<{ first_name: string; last_name: string; is_active: boolean }>
  ): Promise<IInstanceUser> {
    return this.patch(`/api/instances/users/${userId}/`, data)
      .then((res) => res?.data as IInstanceUser)
      .catch((err: { response?: { data: unknown } }) => {
        throw err?.response?.data;
      });
  }

  async resetPassword(userId: string): Promise<{ password: string }> {
    return this.post(`/api/instances/users/${userId}/reset-password/`, {})
      .then((res) => res?.data as { password: string })
      .catch((err: { response?: { data: unknown } }) => {
        throw err?.response?.data;
      });
  }

  async addToWorkspace(userId: string, data: { workspace_id: string; role: number }): Promise<IInstanceUserWorkspace> {
    return this.post(`/api/instances/users/${userId}/workspaces/`, data)
      .then((res) => res?.data as IInstanceUserWorkspace)
      .catch((err: { response?: { data: unknown } }) => {
        throw err?.response?.data;
      });
  }
}
