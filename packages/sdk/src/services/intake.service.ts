import { TInboxIssueStatus, TInboxIssueWithPagination } from "@plane/types";
import { APIService } from "@/services/api.service";
// types
import { ExIntakeIssue, ExIssue } from "@/types/types";
// constants

export type IntakeIssueCreatePayload = {
  issue: Partial<ExIssue>;
};

export class IntakeService extends APIService {
  /**
   * Get all intake issues for a project
   */
  async list(
    workspaceSlug: string,
    projectId: string,
    params?: {
      status?: TInboxIssueStatus | TInboxIssueStatus[];
      cursor?: string;
      per_page?: number;
    }
  ): Promise<TInboxIssueWithPagination> {
    return this.get(`/api/v1/workspaces/${workspaceSlug}/projects/${projectId}/intake-issues/`, {
      params,
    })
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Create a new intake issue
   */
  async create(workspaceSlug: string, projectId: string, payload: IntakeIssueCreatePayload): Promise<ExIntakeIssue> {
    return this.post(`/api/v1/workspaces/${workspaceSlug}/projects/${projectId}/intake-issues/`, payload)
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
