// plane imports
import { EWorkItemConversionType } from "@plane/constants";
import { TEpicAnalytics, TEpicStats } from "@plane/types";
// helpers
import { API_BASE_URL } from "@/helpers/common.helper";
// services
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

  async getEpicMetaFromURL(
    workspaceSlug: string,
    projectId: string,
    epicId: string
  ): Promise<{
    project_identifier: string;
    sequence_id: string;
  }> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/epics/${epicId}/meta/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async convertWorkItemType(
    workspaceSlug: string,
    projectId: string,
    entityId: string,
    entityType: EWorkItemConversionType
  ): Promise<void> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/conversion/${entityId}/`, {
      conversion_type: entityType,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
export const epicService = new EpicService();
