// plane types
import { API_BASE_URL } from "@plane/constants";
import { EUpdateStatus, TUpdate } from "@plane/types";
// services
import { APIService } from "@/services/api.service";

export interface IInitiativeUpdateService {
  getUpdates: (
    workspaceSlug: string,
    initiativeId: string,
    params?: { search: EUpdateStatus }
  ) => Promise<{ project_updates: TUpdate[]; epic_updates: TUpdate[] }>;
}
export class InitiativesUpdateService extends APIService implements IInitiativeUpdateService {
  constructor() {
    super(API_BASE_URL);
  }

  async getUpdates(
    workspaceSlug: string,
    initiativeId: string,
    params?: { search: EUpdateStatus }
  ): Promise<{
    project_updates: TUpdate[];
    epic_updates: TUpdate[];
  }> {
    return this.get(`/api/workspaces/${workspaceSlug}/initiatives/${initiativeId}/updates/`, { params })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
