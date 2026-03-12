/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL } from "@plane/constants";
import { APIService } from "../api.service";

export type DeptType = "" | "HO" | "BRX" | "OSR";

export interface IInstanceDepartment {
  id: string;
  name: string;
  code: string;
  short_name: string;
  dept_code: string;
  dept_type: DeptType;
  description: string;
  parent: string | null;
  level: number;
  manager: string | null;
  manager_detail: { id: string; display_name: string; email: string } | null;
  linked_workspace: string | null;
  linked_workspace_detail: { id: string; name: string; slug: string } | null;
  sort_order: number;
  is_active: boolean;
  staff_count: number;
  created_at: string;
  updated_at: string;
  children?: IInstanceDepartment[];
}

export type IInstanceDepartmentCreate = Omit<
  IInstanceDepartment,
  "id" | "created_at" | "updated_at" | "staff_count" | "manager_detail" | "linked_workspace_detail" | "children"
>;

export type IInstanceDepartmentUpdate = Partial<IInstanceDepartmentCreate>;

export class InstanceDepartmentService extends APIService {
  constructor(BASE_URL?: string) {
    super(BASE_URL || API_BASE_URL);
  }

  async list(params?: Record<string, unknown>): Promise<IInstanceDepartment[]> {
    return this.get("/api/instances/departments/", { params })
      .then((res) => res?.data as IInstanceDepartment[])
      .catch((err: { response?: { data: unknown } }) => {
        throw err?.response?.data;
      });
  }

  async getTree(): Promise<IInstanceDepartment[]> {
    return this.get("/api/instances/departments/tree/")
      .then((res) => res?.data as IInstanceDepartment[])
      .catch((err: { response?: { data: unknown } }) => {
        throw err?.response?.data;
      });
  }

  async detail(id: string): Promise<IInstanceDepartment> {
    return this.get(`/api/instances/departments/${id}/`)
      .then((res) => res?.data as IInstanceDepartment)
      .catch((err: { response?: { data: unknown } }) => {
        throw err?.response?.data;
      });
  }

  async create(data: IInstanceDepartmentCreate): Promise<IInstanceDepartment> {
    return this.post("/api/instances/departments/", data)
      .then((res) => res?.data as IInstanceDepartment)
      .catch((err: { response?: { data: unknown } }) => {
        throw err?.response?.data;
      });
  }

  async update(id: string, data: IInstanceDepartmentUpdate): Promise<IInstanceDepartment> {
    return this.patch(`/api/instances/departments/${id}/`, data)
      .then((res) => res?.data as IInstanceDepartment)
      .catch((err: { response?: { data: unknown } }) => {
        throw err?.response?.data;
      });
  }

  async deleteDepartment(id: string): Promise<void> {
    return this.delete(`/api/instances/departments/${id}/`)
      .then(() => undefined)
      .catch((err: { response?: { data: unknown } }) => {
        throw err?.response?.data;
      });
  }

  async getStaff(id: string): Promise<unknown[]> {
    return this.get(`/api/instances/departments/${id}/staff/`)
      .then((res) => res?.data as unknown[])
      .catch((err: { response?: { data: unknown } }) => {
        throw err?.response?.data;
      });
  }

  async linkWorkspace(id: string, workspaceId: string): Promise<void> {
    return this.post(`/api/instances/departments/${id}/link-workspace/`, { workspace_id: workspaceId })
      .then(() => undefined)
      .catch((err: { response?: { data: unknown } }) => {
        throw err?.response?.data;
      });
  }

  async unlinkWorkspace(id: string): Promise<void> {
    return this.delete(`/api/instances/departments/${id}/link-workspace/`)
      .then(() => undefined)
      .catch((err: { response?: { data: unknown } }) => {
        throw err?.response?.data;
      });
  }
}
