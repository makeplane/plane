// helpers
import { TUserApplication, TWorkspaceAppInstallation } from "@plane/types";
import { API_BASE_URL } from "@plane/constants";
// services
import { APIService } from "@/services/api.service";

export class ApplicationService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getApplications(workspaceSlug: string): Promise<TUserApplication[] | undefined> {
    return this.get(`/api/workspaces/${workspaceSlug}/applications/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async getApplication(workspaceSlug: string, applicationId: string): Promise<TUserApplication | undefined> {
    return this.get(`/api/workspaces/${workspaceSlug}/applications/${applicationId}/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async createApplication(workspaceSlug: string, data: Partial<TUserApplication>): Promise<TUserApplication> {
    return this.post(`/api/workspaces/${workspaceSlug}/applications/`, data)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async updateApplication(
    workspaceSlug: string,
    applicationId: string,
    data: Partial<TUserApplication>
  ): Promise<TUserApplication> {
    return this.patch(`/api/workspaces/${workspaceSlug}/applications/${applicationId}/`, data)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async deleteApplication(workspaceSlug: string, applicationId: string): Promise<any> {
    return this.delete(`/api/workspaces/${workspaceSlug}/applications/${applicationId}/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async regenerateApplicationSecret(workspaceSlug: string, applicationId: string): Promise<TUserApplication> {
    return this.patch(`/api/workspaces/${workspaceSlug}/applications/${applicationId}/regenerate-secret/`, {})
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async checkApplicationSlug(workspaceSlug: string, slug: string): Promise<any> {
    console.log("slug", slug);
    return this.post(`/api/workspaces/${workspaceSlug}/applications/check-slug/`, { app_slug: slug })
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async installApplication(workspaceSlug: string, applicationId: string): Promise<TWorkspaceAppInstallation> {
    return this.post(`/api/workspaces/${workspaceSlug}/applications/${applicationId}/install/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async publishApplication(workspaceSlug: string, applicationId: string): Promise<TWorkspaceAppInstallation> {
    return this.post(`/api/workspaces/${workspaceSlug}/applications/${applicationId}/publish/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async getApplicationByClientId(clientId: string): Promise<Partial<TUserApplication> | undefined> {
    return this.get(`/api/applications/${clientId}/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }
}
