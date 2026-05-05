/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL } from "@plane/constants";
import { APIService } from "../api.service";

export interface IInstanceStaff {
  id: string;
  user: string;
  user_detail: { id: string; display_name: string; email: string; first_name: string; last_name: string } | null;
  staff_id: string;
  department: string | null;
  department_detail: { id: string; name: string; code: string } | null;
  position: string;
  job_grade: string;
  phone: string;
  date_of_joining: string | null;
  date_of_leaving: string | null;
  employment_status: "active" | "probation" | "resigned" | "suspended" | "transferred";
  is_department_manager: boolean;
  notes: string;
  email: string;
  display_name: string;
  created_at: string;
  updated_at: string;
}

export interface IInstanceStaffStats {
  total: number;
  active: number;
  probation: number;
  resigned: number;
  suspended: number;
  transferred: number;
  by_status: Record<string, number>;
  by_department: {
    department_id: string | null;
    department_name: string;
    department_code: string;
    count: number;
  }[];
}

export interface IInstanceStaffPaginatedResponse {
  results: IInstanceStaff[];
  total_count: number;
  total_pages: number;
  next_cursor: string;
  prev_cursor: string;
  next_page_results: boolean;
  prev_page_results: boolean;
}

export interface IInstanceStaffBulkImportResponse {
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
}

export type IInstanceStaffCreate = Omit<
  IInstanceStaff,
  "id" | "created_at" | "updated_at" | "user_detail" | "department_detail"
> & {
  first_name?: string;
  last_name?: string;
  password?: string;
};
export type IInstanceStaffUpdate = Partial<IInstanceStaffCreate>;

export class InstanceStaffService extends APIService {
  constructor(BASE_URL?: string) {
    super(BASE_URL || API_BASE_URL);
  }

  async list(params?: Record<string, unknown>): Promise<IInstanceStaffPaginatedResponse> {
    return this.get("/api/instances/staff/", { params })
      .then((res) => res?.data as IInstanceStaffPaginatedResponse)
      .catch((err: { response?: { data: unknown } }) => {
        throw err?.response?.data;
      });
  }

  async detail(id: string): Promise<IInstanceStaff> {
    return this.get(`/api/instances/staff/${id}/`)
      .then((res) => res?.data as IInstanceStaff)
      .catch((err: { response?: { data: unknown } }) => {
        throw err?.response?.data;
      });
  }

  async create(data: IInstanceStaffCreate): Promise<IInstanceStaff> {
    return this.post("/api/instances/staff/", data)
      .then((res) => res?.data as IInstanceStaff)
      .catch((err: { response?: { data: unknown } }) => {
        throw err?.response?.data;
      });
  }

  async update(id: string, data: IInstanceStaffUpdate): Promise<IInstanceStaff> {
    return this.patch(`/api/instances/staff/${id}/`, data)
      .then((res) => res?.data as IInstanceStaff)
      .catch((err: { response?: { data: unknown } }) => {
        throw err?.response?.data;
      });
  }

  async deleteStaff(id: string): Promise<void> {
    return this.delete(`/api/instances/staff/${id}/`)
      .then(() => undefined)
      .catch((err: { response?: { data: unknown } }) => {
        throw err?.response?.data;
      });
  }

  async transfer(id: string, departmentId: string): Promise<IInstanceStaff> {
    return this.post(`/api/instances/staff/${id}/transfer/`, { department_id: departmentId })
      .then((res) => res?.data as IInstanceStaff)
      .catch((err: { response?: { data: unknown } }) => {
        throw err?.response?.data;
      });
  }

  async deactivate(id: string): Promise<IInstanceStaff> {
    return this.post(`/api/instances/staff/${id}/deactivate/`, {})
      .then((res) => res?.data as IInstanceStaff)
      .catch((err: { response?: { data: unknown } }) => {
        throw err?.response?.data;
      });
  }

  async bulkImport(
    file: File,
    defaultPassword: string,
    skipExisting: boolean,
    updateExisting: boolean = false
  ): Promise<IInstanceStaffBulkImportResponse> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("default_password", defaultPassword);
    formData.append("skip_existing", String(skipExisting));
    formData.append("update_existing", String(updateExisting));
    return this.post("/api/instances/staff/bulk-import/", formData)
      .then((res) => res?.data as IInstanceStaffBulkImportResponse)
      .catch((err: { response?: { data: unknown } }) => {
        throw err?.response?.data;
      });
  }

  async bulkActions(data: Record<string, unknown>): Promise<unknown> {
    return this.post("/api/instances/staff/bulk-actions/", data)
      .then((res) => res?.data as unknown)
      .catch((err: { response?: { data: unknown } }) => {
        throw err?.response?.data;
      });
  }

  async export(): Promise<Blob> {
    return this.get("/api/instances/staff/export/", {}, { responseType: "blob" })
      .then((res) => res?.data as Blob)
      .catch((err: { response?: { data: unknown } }) => {
        throw err?.response?.data;
      });
  }

  async stats(): Promise<IInstanceStaffStats> {
    return this.get("/api/instances/staff/stats/")
      .then((res) => res?.data as IInstanceStaffStats)
      .catch((err: { response?: { data: unknown } }) => {
        throw err?.response?.data;
      });
  }
}
