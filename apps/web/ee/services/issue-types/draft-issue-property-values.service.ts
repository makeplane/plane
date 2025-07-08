// plane imports
import { TIssuePropertyValues } from "@plane/types";
// helpers
import { API_BASE_URL  } from "@plane/constants";
// services
import { APIService } from "@/services/api.service";

export class DraftIssuePropertyValuesService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async fetchAll(workspaceSlug: string, projectId: string, issueId: string): Promise<TIssuePropertyValues> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/draft-issues/${issueId}/values/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async create(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    data: TIssuePropertyValues
  ): Promise<TIssuePropertyValues> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/draft-issues/${issueId}/values/`, {
      property_values: data,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async update(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    propertyId: string,
    data: string[]
  ): Promise<void> {
    return this.patch(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/draft-issues/${issueId}/issue-properties/${propertyId}/values/`,
      {
        values: data,
      }
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
