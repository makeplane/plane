// helpers
import { API_BASE_URL } from "@/helpers/common.helper";
// plane web types
import { TIssuePropertyOption, TIssuePropertyOptionsPayload } from "@/plane-web/types";
// services
import { APIService } from "@/services/api.service";

export class IssuePropertyOptionsService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async fetchAll(workspaceSlug: string, projectId: string): Promise<TIssuePropertyOptionsPayload> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issue-property-options/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async create(
    workspaceSlug: string,
    projectId: string,
    issuePropertyId: string,
    data: Partial<TIssuePropertyOption>
  ): Promise<TIssuePropertyOption> {
    return this.post(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/issue-properties/${issuePropertyId}/options/`,
      data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async update(
    workspaceSlug: string,
    projectId: string,
    issuePropertyId: string,
    issuePropertyOptionId: string,
    data: Partial<TIssuePropertyOption>
  ): Promise<TIssuePropertyOption> {
    return this.patch(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/issue-properties/${issuePropertyId}/options/${issuePropertyOptionId}/`,
      data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteOption(
    workspaceSlug: string,
    projectId: string,
    issuePropertyId: string,
    issuePropertyOptionId: string
  ): Promise<void> {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/issue-properties/${issuePropertyId}/options/${issuePropertyOptionId}/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
