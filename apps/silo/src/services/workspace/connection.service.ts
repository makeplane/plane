import { TWorkspaceConnection, TWorkspaceUserConnection } from "@plane/types";
import { removeUndefinedFromObject } from "@/helpers/generic-helpers";
import { logger } from "@/logger";
import { APIService } from "@/services/api.service";
// types
import { ClientOptions } from "@/types";
export class WorkspaceConnectionAPIService extends APIService {
    constructor(options: ClientOptions) {
        super(options);
    }

    //TODO: Rename this to createOrUpdateWorkspaceConnection
    async createWorkspaceConnection(data: Partial<TWorkspaceConnection>): Promise<TWorkspaceConnection> {
        data = removeUndefinedFromObject(data);
        return this.post(`/api/v1/workspace-connections/`, data)
            .then((response) => response.data)
            .catch((error) => {
                logger.error(error);
                throw error?.response?.data;
            });
    }

    async updateWorkspaceConnection(connectionId: string, data: Partial<TWorkspaceConnection>): Promise<TWorkspaceConnection> {
        data = removeUndefinedFromObject(data);
        return this.patch(`/api/v1/workspace-connections/${connectionId}/`, data)
            .then((response) => response.data)
            .catch((error) => {
                logger.error(error);
                throw error?.response?.data;
            });
    }

    async getWorkspaceConnection(connectionId: string): Promise<TWorkspaceConnection> {
        return this.get(`/api/v1/workspace-connections/${connectionId}/`)
            .then((response) => response.data)
            .catch((error) => {
                logger.error(error);
                throw error?.response?.data;
            });
    }

    async getWorkspaceUserConnections(workspaceId: string, userId: string): Promise<TWorkspaceUserConnection[]> {
        return this.get(`/api/v1/workspace-user-connections/`, { params: { workspace_id: workspaceId, user_id: userId } })
            .then((response) => response.data)
            .catch((error) => {
                logger.error(error);
                throw error?.response?.data;
            });
    }

    async listWorkspaceConnections(params?: Partial<Record<keyof TWorkspaceConnection, string>>): Promise<TWorkspaceConnection[]> {
        params = removeUndefinedFromObject(params);
        return this.get(`/api/v1/workspace-connections/`, { params: params })
            .then((response) => response.data)
            .catch((error) => {
                logger.error(error);
                throw error?.response?.data;
            });
    }

    async deleteWorkspaceConnection(connectionId: string, disconnectMeta?: object, deletedBy?: string): Promise<TWorkspaceConnection> {
        const params: Record<string, unknown> = { deleted_by_id: deletedBy };

        if (disconnectMeta) {
            const disconnectMetaJson = JSON.stringify(disconnectMeta);
            const disconnectMetaEncoded = Buffer.from(disconnectMetaJson).toString("base64");
            params.disconnect_meta = disconnectMetaEncoded;
        }

        return this.delete(`/api/v1/workspace-connections/${connectionId}/`, { params })
            .then((response) => response.data)
            .catch((error) => {
                logger.error(error);
                throw error?.response?.data;
            });
    }
}
