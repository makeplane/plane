import { API_BASE_URL } from "@/helpers/common.helper";
import { TProjectUpdateReaction } from "@/plane-web/types";
// services
import { APIService } from "@/services/api.service";
// types

export class ProjectUpdateReactionService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async createUpdateReaction(
    workspaceSlug: string,
    projectId: string,
    updateId: string,
    data: Partial<TProjectUpdateReaction>
  ): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/updates/${updateId}/reactions/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteUpdateReaction(
    workspaceSlug: string,
    projectId: string,
    updateId: string,
    reaction: string
  ): Promise<any> {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/updates/${updateId}/reactions/${reaction}/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
