// helpers
import { API_BASE_URL } from "@/helpers/common.helper";
// plane web types
import { TIssuePropertyValues } from "@/plane-web/types";
// services
import { APIService } from "@/services/api.service";

export class IssuePropertyValuesService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async fetchAll(workspaceSlug: string, projectId: string, issueId: string): Promise<TIssuePropertyValues> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/values/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createUpdate(workspaceSlug: string, projectId: string, issueId: string, data: TIssuePropertyValues): Promise<TIssuePropertyValues> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/values/`, {
      property_values: data,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
