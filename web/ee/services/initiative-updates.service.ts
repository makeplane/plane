// plane types
import { TUpdate } from "@plane/types";
import { EUpdateStatus } from "@plane/types/src/enums";
import { API_BASE_URL } from "@/helpers/common.helper";
// services
import { APIService } from "@/services/api.service";

export interface IInitiativeUpdateService {
  getUpdates: (workspaceSlug: string, initiativeId: string, params?: { search: EUpdateStatus }) => Promise<TUpdate[]>;
}
export class InitiativesUpdateService extends APIService implements IInitiativeUpdateService {
  constructor() {
    super(API_BASE_URL);
  }

  async getUpdates(
    workspaceSlug: string,
    initiativeId: string,
    params?: { search: EUpdateStatus }
  ): Promise<TUpdate[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/initiatives/${initiativeId}/updates/`, { params })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
