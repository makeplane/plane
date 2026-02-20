/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import { API_BASE_URL } from "@plane/constants";
import { APIService } from "@/services/api.service";

export interface IStaff {
  id: string;
  workspace: string;
  user: string;
  staff_id: string;
  department: string | null;
  department_detail: {
    id: string;
    name: string;
    code: string;
  } | null;
  user_detail: {
    id: string;
    display_name: string;
    email: string;
    first_name: string;
    last_name: string;
  } | null;
  email: string;
  display_name: string;
  position: string;
  job_grade: string;
  phone: string;
  date_of_joining: string | null;
  date_of_leaving: string | null;
  employment_status: "active" | "probation" | "resigned" | "suspended" | "transferred";
  is_department_manager: boolean;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface IStaffCreate {
  staff_id: string;
  first_name: string;
  last_name: string;
  department_id?: string | null;
  position?: string;
  job_grade?: string;
  phone?: string;
  date_of_joining?: string | null;
  is_department_manager?: boolean;
  password: string;
  notes?: string;
}

export interface IStaffUpdate {
  department?: string;
  position?: string;
  job_grade?: string;
  phone?: string;
  date_of_joining?: string | null;
  date_of_leaving?: string | null;
  employment_status?: string;
  is_department_manager?: boolean;
  notes?: string;
}

export interface IStaffStats {
  total: number;
  active: number;
  probation: number;
  resigned: number;
  suspended: number;
  transferred: number;
  by_status: Record<string, number>;
  by_department: Array<{
    department_id: string | null;
    department_name: string;
    department_code: string;
    count: number;
  }>;
}

export class StaffService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  /**
   * Get all staff for a workspace
   * @param workspaceSlug - Workspace slug
   * @param params - Query parameters
   * @returns Promise resolving to array of staff
   */
  async getStaffList(workspaceSlug: string, params?: Record<string, any>): Promise<IStaff[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/staff/`, { params })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Get a single staff member
   * @param workspaceSlug - Workspace slug
   * @param staffId - Staff ID
   * @returns Promise resolving to staff
   */
  async getStaff(workspaceSlug: string, staffId: string): Promise<IStaff> {
    return this.get(`/api/workspaces/${workspaceSlug}/staff/${staffId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Create a new staff member
   * @param workspaceSlug - Workspace slug
   * @param data - Staff creation payload
   * @returns Promise resolving to created staff
   */
  async createStaff(workspaceSlug: string, data: IStaffCreate): Promise<IStaff> {
    return this.post(`/api/workspaces/${workspaceSlug}/staff/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Update a staff member
   * @param workspaceSlug - Workspace slug
   * @param staffId - Staff ID
   * @param data - Staff update payload
   * @returns Promise resolving to updated staff
   */
  async updateStaff(workspaceSlug: string, staffId: string, data: IStaffUpdate): Promise<IStaff> {
    return this.patch(`/api/workspaces/${workspaceSlug}/staff/${staffId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Delete a staff member
   * @param workspaceSlug - Workspace slug
   * @param staffId - Staff ID
   */
  async deleteStaff(workspaceSlug: string, staffId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/staff/${staffId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Transfer staff to another department
   * @param workspaceSlug - Workspace slug
   * @param staffId - Staff ID
   * @param departmentId - Target department ID
   */
  async transferStaff(workspaceSlug: string, staffId: string, departmentId: string): Promise<IStaff> {
    return this.post(`/api/workspaces/${workspaceSlug}/staff/${staffId}/transfer/`, { department_id: departmentId })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Deactivate a staff member
   * @param workspaceSlug - Workspace slug
   * @param staffId - Staff ID
   */
  async deactivateStaff(workspaceSlug: string, staffId: string): Promise<IStaff> {
    return this.post(`/api/workspaces/${workspaceSlug}/staff/${staffId}/deactivate/`, {})
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Bulk import staff from CSV
   * @param workspaceSlug - Workspace slug
   * @param formData - FormData with CSV file
   */
  async bulkImport(workspaceSlug: string, formData: FormData): Promise<{ success: number; errors: any[] }> {
    return this.post(`/api/workspaces/${workspaceSlug}/staff/bulk-import/`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Export staff to CSV
   * @param workspaceSlug - Workspace slug
   */
  async exportStaff(workspaceSlug: string): Promise<Blob> {
    return this.get(`/api/workspaces/${workspaceSlug}/staff/export/`, {}, { responseType: "blob" })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Get staff statistics
   * @param workspaceSlug - Workspace slug
   */
  async getStats(workspaceSlug: string): Promise<IStaffStats> {
    return this.get(`/api/workspaces/${workspaceSlug}/staff/stats/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
