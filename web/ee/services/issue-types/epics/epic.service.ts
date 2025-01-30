import { TEpicStats } from "@plane/types";
// services
import { API_BASE_URL } from "@/helpers/common.helper";
import { TEpicAnalytics } from "@/plane-web/types";
import { APIService } from "@/services/api.service";

export class EpicService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getIssueProgressAnalytics(workspaceSlug: string, projectId: string, issueId: string): Promise<TEpicAnalytics> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/epics/${issueId}/analytics/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async fetchEpicStats(workspaceSlug: string, projectId: string): Promise<TEpicStats[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/epic-analytics/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

export const epicService = new EpicService();
