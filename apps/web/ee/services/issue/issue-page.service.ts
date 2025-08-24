// types
import { API_BASE_URL } from "@plane/constants";
import { TIssuePage } from "@plane/types";
// helpers
// services
import { APIService } from "@/services/api.service";

export class IssuePageService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async fetchWorkItemPages(
    workspaceSlug: string,
    projectId: string,
    workItemId: string
  ): Promise<{ page: TIssuePage }[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/work-items/${workItemId}/pages/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async removeWorkItemPage(
    workspaceSlug: string,
    projectId: string,
    workItemId: string,
    pageId: string
  ): Promise<void> {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/work-items/${workItemId}/pages/${pageId}/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateWorkItemPage(
    workspaceSlug: string,
    projectId: string,
    workItemId: string,
    pages_ids: string[]
  ): Promise<{ page: TIssuePage }[]> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/work-items/${workItemId}/pages/`, {
      pages_ids,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
