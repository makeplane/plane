import { API_BASE_URL } from "@plane/constants";
import type { IRosterFilters, IRosterPlayer, IRosterPlayerPayload } from "@plane/types";
import { APIService } from "@/services/api.service";

type TRosterImportPayload = {
  players: IRosterPlayerPayload[];
};

type TRosterImportResponse = {
  success: boolean;
  data: IRosterPlayer[];
  imported_count: number;
  message: string;
};

export class RosterService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getRoster(workspaceSlug: string, projectId: string, filters?: IRosterFilters): Promise<IRosterPlayer[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/roster/`, { params: filters })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getRosterPlayer(workspaceSlug: string, projectId: string, playerId: string): Promise<IRosterPlayer> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/roster/${playerId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createRosterPlayer(
    workspaceSlug: string,
    projectId: string,
    payload: IRosterPlayerPayload
  ): Promise<IRosterPlayer> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/roster/`, payload)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateRosterPlayer(
    workspaceSlug: string,
    projectId: string,
    playerId: string,
    payload: Partial<IRosterPlayerPayload>
  ): Promise<IRosterPlayer> {
    return this.patch(`/api/workspaces/${workspaceSlug}/projects/${projectId}/roster/${playerId}/`, payload)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteRosterPlayer(workspaceSlug: string, projectId: string, playerId: string): Promise<{ message: string }> {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/roster/${playerId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async importRoster(
    workspaceSlug: string,
    projectId: string,
    payload: TRosterImportPayload
  ): Promise<TRosterImportResponse> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/roster/import/`, payload)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
