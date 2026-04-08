/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL } from "@plane/constants";
import { APIService } from "../api.service";

export type DeptType = "" | "HO" | "BRX" | "OSR";

export interface IDepartmentBulkImportRow {
  name: string;
  code?: string;
  short_name?: string;
  dept_code?: string;
  dept_type?: DeptType;
  parent_code?: string;
  manager_email?: string;
  sort_order?: number;
  is_active?: boolean;
}

export interface IDepartmentBulkImportRequest {
  departments: IDepartmentBulkImportRow[];
}

export interface IDepartmentBulkImportSkipped {
  row_number: number;
  name: string;
  reason: string;
}

export interface IDepartmentBulkImportResponse {
  created: IInstanceDepartment[];
  skipped: IDepartmentBulkImportSkipped[];
  total_created: number;
  total_skipped: number;
}

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
  task_category_ids: string[];
  sort_order: number;
  is_active: boolean;
  staff_count: number;
  created_at: string;
  updated_at: string;
  children?: IInstanceDepartment[];
}

export type IInstanceDepartmentCreate = Omit<
  IInstanceDepartment,
  | "id"
  | "created_at"
  | "updated_at"
  | "staff_count"
  | "manager_detail"
  | "linked_workspace_detail"
  | "task_category_ids"
  | "children"
>;

export type IInstanceDepartmentUpdate = Partial<IInstanceDepartmentCreate>;

export interface IManagerAdded {
  id: string;
  display_name: string;
  email: string;
}

export interface ILinkWorkspaceResult {
  managers_added: IManagerAdded[];
  async?: boolean;
  staff_count?: number;
}

export type TAutoJoinMode = "all_projects" | "bank_wide_projects";

export interface IAutoJoinResult {
  newly_added: number;
  already_member: number;
  total: number;
}

export interface IRejoinAllResult {
  departments_processed: number;
  newly_added: number;
  already_member: number;
  total: number;
}

export interface IDepartmentBulkLinkRow {
  code: string;
  workspace_slug: string;
}

export interface IDepartmentBulkLinkRequest {
  links: IDepartmentBulkLinkRow[];
}

export interface IDepartmentBulkLinkLinked {
  code: string;
  name: string;
  workspace: string;
}

export interface IDepartmentBulkLinkSkipped {
  row: number;
  code?: string;
  reason: string;
}

export interface IDepartmentBulkLinkResponse {
  linked: IDepartmentBulkLinkLinked[];
  skipped: IDepartmentBulkLinkSkipped[];
  total_linked: number;
  total_skipped: number;
}

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

  async linkWorkspace(id: string, workspaceId: string): Promise<ILinkWorkspaceResult> {
    return this.post(`/api/instances/departments/${id}/link-workspace/`, { workspace_id: workspaceId })
      .then((res) => res?.data as ILinkWorkspaceResult)
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

  async autoJoin(id: string, mode: TAutoJoinMode): Promise<IAutoJoinResult> {
    return this.post(`/api/instances/departments/${id}/auto-join/`, { mode })
      .then((res) => res?.data as IAutoJoinResult)
      .catch((err: { response?: { data: unknown } }) => {
        throw err?.response?.data;
      });
  }

  async rejoinAll(mode: TAutoJoinMode): Promise<IRejoinAllResult> {
    return this.post("/api/instances/departments/rejoin-all/", { mode })
      .then((res) => res?.data as IRejoinAllResult)
      .catch((err: { response?: { data: unknown } }) => {
        throw err?.response?.data;
      });
  }

  async bulkImport(data: IDepartmentBulkImportRequest): Promise<IDepartmentBulkImportResponse> {
    return this.post("/api/instances/departments/bulk-import/", data)
      .then((res) => res?.data as IDepartmentBulkImportResponse)
      .catch((err: { response?: { data: unknown } }) => {
        throw err?.response?.data;
      });
  }

  async bulkLinkWorkspace(data: IDepartmentBulkLinkRequest): Promise<IDepartmentBulkLinkResponse> {
    return this.post("/api/instances/departments/bulk-link-workspace/", data)
      .then((res) => res?.data as IDepartmentBulkLinkResponse)
      .catch((err: { response?: { data: unknown } }) => {
        throw err?.response?.data;
      });
  }

  async linkTaskCategories(id: string, taskCategoryIds: string[]): Promise<IInstanceDepartment> {
    return this.put(`/api/instances/departments/${id}/link-task-categories/`, {
      task_category_ids: taskCategoryIds,
    })
      .then((res) => res?.data as IInstanceDepartment)
      .catch((err: { response?: { data: unknown } }) => {
        throw err?.response?.data;
      });
  }
}
