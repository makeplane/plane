import { TWorkspaceConnection, TWorkspaceUserConnection } from "@plane/types";
import { APIService } from "@/services/api.service";
// types
import { ClientOptions } from "@/types";

export class WorkspaceConnectionAPIService extends APIService {
    constructor(options: ClientOptions) {
        super(options);
    }

    async createWorkspaceConnection(data: Partial<TWorkspaceConnection>): Promise<TWorkspaceConnection> {
        return this.post(`/api/v1/workspace-connections/`, data)
            .then((response) => response.data)
            .catch((error) => {
                console.log(error);
                throw error?.response?.data;
            });
    }

    async updateWorkspaceConnection(connectionId: string, data: Partial<TWorkspaceConnection>): Promise<TWorkspaceConnection> {
        return this.patch(`/api/v1/workspace-connections/${connectionId}/`, data)
            .then((response) => response.data)
            .catch((error) => {
                console.log(error);
                throw error?.response?.data;
            });
    }

    async getWorkspaceConnection(connectionId: string): Promise<TWorkspaceConnection> {
        return this.get(`/api/v1/workspace-connections/${connectionId}/`)
            .then((response) => response.data)
            .catch((error) => {
                console.log(error);
                throw error?.response?.data;
            });
    }

    async getWorkspaceUserConnections(workspaceId: string, userId: string): Promise<TWorkspaceUserConnection[]> {
        return this.get(`/api/v1/workspace-user-connections/`, { params: { workspace_id: workspaceId, user_id: userId } })
            .then((response) => response.data)
            .catch((error) => {
                console.log(error);
                throw error?.response?.data;
            });
    }

    async listWorkspaceConnections(params?: Partial<Record<keyof TWorkspaceConnection, string>>): Promise<TWorkspaceConnection[]> {
        return this.get(`/api/v1/workspace-connections/`, { params: params })
            .then((response) => response.data)
            .catch((error) => {
                console.log(error);
                throw error?.response?.data;
            });
    }

    async deleteWorkspaceConnection(connectionId: string): Promise<TWorkspaceConnection> {
        return this.delete(`/api/v1/workspace-connections/${connectionId}/`)
            .then((response) => response.data)
            .catch((error) => {
                console.log(error);
                throw error?.response?.data;
            });
    }


}
