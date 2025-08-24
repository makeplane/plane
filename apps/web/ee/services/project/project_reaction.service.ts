import { API_BASE_URL } from "@plane/constants";
import { TProjectReaction } from "@/plane-web/types";
// services
import { APIService } from "@/services/api.service";

export class ProjectReactionService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getProjectReactions(workspaceSlug: string, projectId: string): Promise<TProjectReaction[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/reactions/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createProjectReaction(workspaceSlug: string, projectId: string, data: Partial<TProjectReaction>): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/reactions/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteProjectReaction(workspaceSlug: string, projectId: string, reaction: string): Promise<any> {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/reactions/${reaction}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
