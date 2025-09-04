import { API_BASE_URL } from "@plane/constants";
// types
import { TWorkspaceEntityConnection } from "@plane/types";
import { APIService } from "../api.service";

export class WorkspaceEntityConnectionService extends APIService {
  constructor(BASE_URL?: string) {
    super(BASE_URL || API_BASE_URL);
  }

  async createWorkspaceEntityConnection(
    workspaceSlug: string,
    data: Partial<TWorkspaceEntityConnection>
  ): Promise<TWorkspaceEntityConnection> {
    return this.post(`/api/workspaces/${workspaceSlug}/entity-connections/`, data)
      .then((response) => response.data)
      .catch((error) => {
        console.log(error);
        throw error?.response?.data;
      });
  }

  async updateWorkspaceEntityConnection(
    workspaceSlug: string,
    connectionId: string,
    data: Partial<TWorkspaceEntityConnection>
  ): Promise<TWorkspaceEntityConnection> {
    return this.patch(`/api/workspaces/${workspaceSlug}/entity-connections/${connectionId}`, data)
      .then((response) => response.data)
      .catch((error) => {
        console.log(error);
        throw error?.response?.data;
      });
  }

  async getWorkspaceEntityConnection(workspaceSlug: string, connectionId: string): Promise<TWorkspaceEntityConnection> {
    return this.get(`/api/workspaces/${workspaceSlug}/entity-connections/${connectionId}`)
      .then((response) => response.data)
      .catch((error) => {
        console.log(error);
        throw error?.response?.data;
      });
  }

  async listWorkspaceEntityConnections(
    workspaceSlug: string,
    params?: Partial<Record<keyof TWorkspaceEntityConnection, string | boolean | number>>
  ): Promise<TWorkspaceEntityConnection[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/entity-connections/`, { params: params })
      .then((response) => response.data)
      .catch((error) => {
        console.log(error);
        throw error?.response?.data;
      });
  }

  async deleteWorkspaceEntityConnection(
    workspaceSlug: string,
    connectionId: string
  ): Promise<TWorkspaceEntityConnection> {
    return this.delete(`/api/workspaces/${workspaceSlug}/entity-connections/${connectionId}`)
      .then((response) => response.data)
      .catch((error) => {
        console.log(error);
        throw error?.response?.data;
      });
  }
}
