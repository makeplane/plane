import { API_BASE_URL } from "@plane/constants";
import type { ICompany, ICompanySettings, ICompanyMemberRole } from "@plane/types";
import { APIService } from "./api.service";

export class CompanyService extends APIService {
  constructor(BASE_URL?: string) {
    super(BASE_URL || API_BASE_URL);
  }

  async getCompanies(workspaceSlug: string): Promise<ICompany[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/companies/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async getCompany(workspaceSlug: string, companyId: string): Promise<ICompany> {
    return this.get(`/api/workspaces/${workspaceSlug}/companies/${companyId}/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async createCompany(workspaceSlug: string, data: Partial<ICompany>): Promise<ICompany> {
    return this.post(`/api/workspaces/${workspaceSlug}/companies/`, data)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async updateCompany(workspaceSlug: string, companyId: string, data: Partial<ICompany>): Promise<ICompany> {
    return this.patch(`/api/workspaces/${workspaceSlug}/companies/${companyId}/`, data)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async deleteCompany(workspaceSlug: string, companyId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/companies/${companyId}/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async getCompanySettings(workspaceSlug: string, companyId: string): Promise<ICompanySettings> {
    return this.get(`/api/workspaces/${workspaceSlug}/companies/${companyId}/settings/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async updateCompanySettings(
    workspaceSlug: string,
    companyId: string,
    data: Partial<ICompanySettings>
  ): Promise<ICompanySettings> {
    return this.patch(`/api/workspaces/${workspaceSlug}/companies/${companyId}/settings/`, data)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async getCompanyMemberRoles(workspaceSlug: string, companyId: string): Promise<ICompanyMemberRole[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/companies/${companyId}/roles/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async assignRole(
    workspaceSlug: string,
    companyId: string,
    data: Partial<ICompanyMemberRole>
  ): Promise<ICompanyMemberRole> {
    return this.post(`/api/workspaces/${workspaceSlug}/companies/${companyId}/roles/`, data)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async removeRole(workspaceSlug: string, companyId: string, roleId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/companies/${companyId}/roles/${roleId}/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }
}

export const companyService = new CompanyService();
