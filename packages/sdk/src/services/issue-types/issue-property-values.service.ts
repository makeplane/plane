import { APIService } from "@/services/api.service";
// types
import { ClientOptions, ExIssuePropertyValue } from "@/types";

export class IssuePropertyValueService extends APIService {
  constructor(options: ClientOptions) {
    super(options);
  }

  async fetch(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    propertyId: string
  ): Promise<ExIssuePropertyValue> {
    return this.get(
      `/api/v1/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/issue-properties/${propertyId}/values/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error;
      });
  }

  async create(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    propertyId: string,
    data: { values: ExIssuePropertyValue }
  ): Promise<ExIssuePropertyValue> {
    return this.post(
      `/api/v1/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/issue-properties/${propertyId}/values/`,
      data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error;
      });
  }
}
