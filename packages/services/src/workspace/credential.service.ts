import { API_BASE_URL } from "@plane/constants";
import { TWorkspaceCredential, TWorkspaceCredentialVerification } from "@plane/types";
import { APIService } from "../api.service";

export class WorkspaceCredentialService extends APIService {
  constructor(BASE_URL?: string) {
    super(BASE_URL || API_BASE_URL);
  }

  async createWorkspaceCredential(
    workspaceSlug: string,
    data: Partial<TWorkspaceCredential>
  ): Promise<TWorkspaceCredential> {
    return this.post(`/api/workspaces/${workspaceSlug}/credentials/`, data)
      .then((response) => response.data)
      .catch((error) => {
        console.log(error);
        throw error?.response?.data;
      });
  }

  async updateWorkspaceCredential(
    workspaceSlug: string,
    credentialId: string,
    data: Partial<TWorkspaceCredential>
  ): Promise<TWorkspaceCredential> {
    return this.patch(`/api/workspaces/${workspaceSlug}/credentials/${credentialId}`, data)
      .then((response) => response.data)
      .catch((error) => {
        console.log(error);
        throw error?.response?.data;
      });
  }

  async getWorkspaceCredential(workspaceSlug: string, credentialId: string): Promise<TWorkspaceCredential> {
    return this.get(`/api/workspaces/${workspaceSlug}/credentials/${credentialId}`)
      .then((response) => response.data)
      .catch((error) => {
        console.log(error);
        throw error?.response?.data;
      });
  }

  async listWorkspaceCredentials(
    workspaceSlug: string,
    params?: Partial<Record<keyof TWorkspaceCredential, string>>
  ): Promise<TWorkspaceCredential[]> {
    return this.get(`/api/v1/workspaces/${workspaceSlug}/credentials/`, { params: params })
      .then((response) => response.data)
      .catch((error) => {
        console.log(error);
        throw error?.response?.data;
      });
  }

  async verifyWorkspaceCredentials(
    workspaceSlug: string,
    source: string,
    userId: string
  ): Promise<TWorkspaceCredentialVerification> {
    return this.get(`/api/v1/workspaces/${workspaceSlug}/credentials/token-verify/`, {
      params: { source, user_id: userId },
    })
      .then((response) => response.data)
      .catch((error) => {
        console.log(error);
        throw error?.response?.data;
      });
  }

  async deleteWorkspaceCredential(workspaceSlug: string, credentialId: string): Promise<TWorkspaceCredential> {
    return this.delete(`/api/workspaces/${workspaceSlug}/credentials/${credentialId}`)
      .then((response) => response.data)
      .catch((error) => {
        console.log(error);
        throw error?.response?.data;
      });
  }

  async verifyToken(workspaceSlug: string, credentialId: string, token: string): Promise<TWorkspaceCredential> {
    return this.post(`/api/workspaces/${workspaceSlug}/credentials/${credentialId}/token-verify/`, { token })
      .then((response) => response.data)
      .catch((error) => {
        console.log(error);
        throw error?.response?.data;
      });
  }
}
