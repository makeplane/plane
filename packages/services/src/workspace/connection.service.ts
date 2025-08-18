// types
import { API_BASE_URL } from "@plane/constants";
import { APIService } from "../api.service";
import { TWorkspaceConnection, TWorkspaceUserConnection } from "@plane/types";

export class WorkspaceConnectionService extends APIService {
  constructor(BASE_URL?: string) {
    super(BASE_URL || API_BASE_URL);
  }

  async updateWorkspaceConnection(
    workspaceSlug: string,
    connectionId: string,
    data: Partial<TWorkspaceConnection>
  ): Promise<TWorkspaceConnection> {
    return this.patch(`/api/workspaces/${workspaceSlug}/connections/${connectionId}`, data)
      .then((response) => response.data)
      .catch((error) => {
        console.log(error);
        throw error?.response?.data;
      });
  }

  async getWorkspaceConnection(workspaceSlug: string, connectionId: string): Promise<TWorkspaceConnection> {
    return this.get(`/api/workspaces/${workspaceSlug}/connections/${connectionId}`)
      .then((response) => response.data)
      .catch((error) => {
        console.log(error);
        throw error?.response?.data;
      });
  }

  async getWorkspaceUserConnections(workspaceSlug: string, userId: string): Promise<TWorkspaceUserConnection[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/user-connections/${userId}/`)
      .then((response) => response.data)
      .catch((error) => {
        console.log(error);
        throw error?.response?.data;
      });
  }

  async listWorkspaceConnections(
    workspaceSlug: string,
    params?: Partial<Record<keyof TWorkspaceConnection, string | boolean | number>>
  ): Promise<TWorkspaceConnection[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/connections/`, { params: params })
      .then((response) => response.data)
      .catch((error) => {
        console.log(error);
        throw error?.response?.data;
      });
  }

  async deleteWorkspaceConnection(workspaceSlug: string, connectionId: string): Promise<TWorkspaceConnection> {
    return this.delete(`/api/workspaces/${workspaceSlug}/connections/${connectionId}`)
      .then((response) => response.data)
      .catch((error) => {
        console.log(error);
        throw error?.response?.data;
      });
  }
}
