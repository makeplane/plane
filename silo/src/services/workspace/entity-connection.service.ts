import { TWorkspaceEntityConnection } from "@plane/types";
import { APIService } from "@/services/api.service";
// types
import { ClientOptions } from "@/types";
import { logger } from "@/logger";

export class WorkspaceEntityConnectionAPIService extends APIService {
  constructor(options: ClientOptions) {
    super(options);
  }

  async createWorkspaceEntityConnection(
    data: Partial<TWorkspaceEntityConnection>
  ): Promise<TWorkspaceEntityConnection> {
    return this.post(`/api/v1/workspace-entity-connections/`, data)
      .then((response) => response.data)
      .catch((error) => {
        logger.error(error);
        throw error?.response?.data;
      });
  }

  async updateWorkspaceEntityConnection(
    connectionId: string,
    data: Partial<TWorkspaceEntityConnection>
  ): Promise<TWorkspaceEntityConnection> {
    return this.patch(`/api/v1/workspace-entity-connections/${connectionId}/`, data)
      .then((response) => response.data)
      .catch((error) => {
        logger.error(error);
        throw error?.response?.data;
      });
  }

  async getWorkspaceEntityConnection(connectionId: string): Promise<TWorkspaceEntityConnection> {
    return this.get(`/api/v1/workspace-entity-connections/${connectionId}/`)
      .then((response) => response.data)
      .catch((error) => {
        logger.error(error);
        throw error?.response?.data;
      });
  }

  async listWorkspaceEntityConnections(
    params?: Partial<Record<keyof TWorkspaceEntityConnection, string>>
  ): Promise<TWorkspaceEntityConnection[]> {
    return this.get(`/api/v1/workspace-entity-connections/`, { params: params })
      .then((response) => response.data)
      .catch((error) => {
        logger.error(error);
        throw error?.response?.data;
      });
  }

  async deleteWorkspaceEntityConnection(connectionId: string): Promise<TWorkspaceEntityConnection> {
    return this.delete(`/api/v1/workspace-entity-connections/${connectionId}/`)
      .then((response) => response.data)
      .catch((error) => {
        logger.error(error);
        throw error?.response?.data;
      });
  }
}
