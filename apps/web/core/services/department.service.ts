/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import { API_BASE_URL } from "@plane/constants";
import { APIService } from "@/services/api.service";

export interface IDepartment {
  id: string;
  name: string;
  code: string;
  short_name?: string;
  dept_code?: string;
  description?: string;
  parent?: string;
  level: number;
  manager?: string;
  manager_detail?: {
    id: string;
    display_name: string;
    email: string;
  } | null;
  linked_project?: string | null;
  linked_project_detail?: {
    id: string;
    name: string;
    identifier: string;
  } | null;
  staff_count: number;
  children?: IDepartment[];
  created_at: string;
  updated_at: string;
}

export interface IDepartmentCreate {
  name: string;
  code: string;
  short_name?: string;
  dept_code?: string;
  description?: string;
  parent?: string;
  level: number;
  manager?: string;
}

export interface IDepartmentUpdate {
  name?: string;
  code?: string;
  short_name?: string;
  dept_code?: string;
  description?: string;
  parent?: string;
  level?: number;
  manager?: string;
}

export class DepartmentService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  /**
   * Get all departments for a workspace
   * @param workspaceSlug - Workspace slug
   * @returns Promise resolving to array of departments
   */
  async getDepartments(workspaceSlug: string): Promise<IDepartment[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/departments/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Get department tree structure
   * @param workspaceSlug - Workspace slug
   * @returns Promise resolving to tree of departments
   */
  async getDepartmentTree(workspaceSlug: string): Promise<IDepartment[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/departments/tree/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Get a single department
   * @param workspaceSlug - Workspace slug
   * @param departmentId - Department ID
   * @returns Promise resolving to department
   */
  async getDepartment(workspaceSlug: string, departmentId: string): Promise<IDepartment> {
    return this.get(`/api/workspaces/${workspaceSlug}/departments/${departmentId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Create a new department
   * @param workspaceSlug - Workspace slug
   * @param data - Department creation payload
   * @returns Promise resolving to created department
   */
  async createDepartment(workspaceSlug: string, data: IDepartmentCreate): Promise<IDepartment> {
    return this.post(`/api/workspaces/${workspaceSlug}/departments/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Update a department
   * @param workspaceSlug - Workspace slug
   * @param departmentId - Department ID
   * @param data - Department update payload
   * @returns Promise resolving to updated department
   */
  async updateDepartment(workspaceSlug: string, departmentId: string, data: IDepartmentUpdate): Promise<IDepartment> {
    return this.patch(`/api/workspaces/${workspaceSlug}/departments/${departmentId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Delete a department
   * @param workspaceSlug - Workspace slug
   * @param departmentId - Department ID
   */
  async deleteDepartment(workspaceSlug: string, departmentId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/departments/${departmentId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Link a project to a department
   * @param workspaceSlug - Workspace slug
   * @param departmentId - Department ID
   * @param projectId - Project ID
   */
  async linkProject(workspaceSlug: string, departmentId: string, projectId: string): Promise<IDepartment> {
    return this.post(`/api/workspaces/${workspaceSlug}/departments/${departmentId}/link-project/`, {
      project_id: projectId,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Unlink a project from a department
   * @param workspaceSlug - Workspace slug
   * @param departmentId - Department ID
   */
  async unlinkProject(workspaceSlug: string, departmentId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/departments/${departmentId}/link-project/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Get staff members for a department
   * @param workspaceSlug - Workspace slug
   * @param departmentId - Department ID
   */
  async getDepartmentStaff(workspaceSlug: string, departmentId: string): Promise<any[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/departments/${departmentId}/staff/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
