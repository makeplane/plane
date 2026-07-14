/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import { API_BASE_URL } from "@plane/constants";
import type {
  TAdjustment,
  TAguinaldoReport,
  TAnnualCostReport,
  TEmployee,
  TOffice,
  TPayrollAccess,
  TPayrollPayment,
  TSalary,
} from "@plane/types";
// services
import { APIService } from "@/services/api.service";

export class PayrollService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  private base(workspaceSlug: string) {
    return `/api/workspaces/${workspaceSlug}/payroll`;
  }

  // offices

  async getOffices(workspaceSlug: string): Promise<TOffice[]> {
    return this.get(`${this.base(workspaceSlug)}/offices/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createOffice(workspaceSlug: string, data: Partial<TOffice>): Promise<TOffice> {
    return this.post(`${this.base(workspaceSlug)}/offices/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateOffice(workspaceSlug: string, officeId: string, data: Partial<TOffice>): Promise<TOffice> {
    return this.patch(`${this.base(workspaceSlug)}/offices/${officeId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteOffice(workspaceSlug: string, officeId: string): Promise<void> {
    return this.delete(`${this.base(workspaceSlug)}/offices/${officeId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // employees

  async getEmployees(workspaceSlug: string, search?: string): Promise<TEmployee[]> {
    return this.get(`${this.base(workspaceSlug)}/employees/`, { params: search ? { search } : {} })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createEmployee(workspaceSlug: string, data: Partial<TEmployee>): Promise<TEmployee> {
    return this.post(`${this.base(workspaceSlug)}/employees/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateEmployee(workspaceSlug: string, employeeId: string, data: Partial<TEmployee>): Promise<TEmployee> {
    return this.patch(`${this.base(workspaceSlug)}/employees/${employeeId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteEmployee(workspaceSlug: string, employeeId: string): Promise<void> {
    return this.delete(`${this.base(workspaceSlug)}/employees/${employeeId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // salaries — a raise POSTs a new row; the API closes the previous one

  async getSalaries(workspaceSlug: string, employeeId: string): Promise<TSalary[]> {
    return this.get(`${this.base(workspaceSlug)}/employees/${employeeId}/salaries/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createSalary(workspaceSlug: string, employeeId: string, data: Partial<TSalary>): Promise<TSalary> {
    return this.post(`${this.base(workspaceSlug)}/employees/${employeeId}/salaries/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteSalary(workspaceSlug: string, employeeId: string, salaryId: string): Promise<void> {
    return this.delete(`${this.base(workspaceSlug)}/employees/${employeeId}/salaries/${salaryId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // adjustments (bonuses, debts, support)

  async getAdjustments(workspaceSlug: string, employeeId: string): Promise<TAdjustment[]> {
    return this.get(`${this.base(workspaceSlug)}/employees/${employeeId}/adjustments/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createAdjustment(workspaceSlug: string, employeeId: string, data: Partial<TAdjustment>): Promise<TAdjustment> {
    return this.post(`${this.base(workspaceSlug)}/employees/${employeeId}/adjustments/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteAdjustment(workspaceSlug: string, employeeId: string, adjustmentId: string): Promise<void> {
    return this.delete(`${this.base(workspaceSlug)}/employees/${employeeId}/adjustments/${adjustmentId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // payroll payments

  async getPayments(
    workspaceSlug: string,
    filters?: { upcoming?: boolean; status?: string[]; employee?: string }
  ): Promise<TPayrollPayment[]> {
    const params = new URLSearchParams();
    if (filters?.upcoming) params.set("upcoming", "1");
    (filters?.status ?? []).forEach((status) => params.append("status", status));
    if (filters?.employee) params.set("employee", filters.employee);
    const query = params.toString();
    return this.get(`${this.base(workspaceSlug)}/payments/${query ? `?${query}` : ""}`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createPayment(workspaceSlug: string, data: Partial<TPayrollPayment>): Promise<TPayrollPayment> {
    return this.post(`${this.base(workspaceSlug)}/payments/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updatePayment(
    workspaceSlug: string,
    paymentId: string,
    data: Partial<TPayrollPayment>
  ): Promise<TPayrollPayment> {
    return this.patch(`${this.base(workspaceSlug)}/payments/${paymentId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deletePayment(workspaceSlug: string, paymentId: string): Promise<void> {
    return this.delete(`${this.base(workspaceSlug)}/payments/${paymentId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // reports

  async getAguinaldo(workspaceSlug: string, year: number): Promise<TAguinaldoReport> {
    return this.get(`${this.base(workspaceSlug)}/aguinaldo/`, { params: { year } })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /** Whether the caller may see the annual cost. There is no setter — the grant
   * lives in the database precisely so no admin can hand it to themselves.
   */
  async getAccess(workspaceSlug: string): Promise<TPayrollAccess> {
    return this.get(`${this.base(workspaceSlug)}/access/`)
      .then((response) => response?.data)
      .catch(() => ({ can_view_annual_cost: false }));
  }

  async getAnnualCost(workspaceSlug: string, year: number): Promise<TAnnualCostReport> {
    return this.get(`${this.base(workspaceSlug)}/annual-cost/`, { params: { year } })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

export const payrollService = new PayrollService();
