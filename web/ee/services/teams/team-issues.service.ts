// types
import type { IIssueFiltersResponse, TIssuesResponse } from "@plane/types";
// helpers
import { API_BASE_URL } from "@/helpers/common.helper";
// services
import { APIService } from "@/services/api.service";

export class TeamIssuesService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getIssuesFromServer(
    workspaceSlug: string,
    teamId: string,
    queries?: any,
    config = {}
  ): Promise<TIssuesResponse> {
    const path =
      (queries.expand as string)?.includes("issue_relation") && !queries.group_by
        ? `/api/workspaces/${workspaceSlug}/teams/${teamId}/issues-detail/`
        : `/api/workspaces/${workspaceSlug}/teams/${teamId}/issues/`;
    return this.get(
      path,
      {
        params: queries,
      },
      config
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // team issues
  async getIssues(workspaceSlug: string, teamId: string, queries?: any, config = {}): Promise<TIssuesResponse> {
    // if (!isEmpty(queries.expand as string) && !queries.group_by)
    return await this.getIssuesFromServer(workspaceSlug, teamId, queries, config);
  }

  // team issue filters
  async fetchTeamIssueFilters(workspaceSlug: string, teamId: string): Promise<IIssueFiltersResponse> {
    return this.get(`/api/workspaces/${workspaceSlug}/teams/${teamId}/user-properties/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async patchTeamIssueFilters(
    workspaceSlug: string,
    teamId: string,
    data: Partial<IIssueFiltersResponse>
  ): Promise<void> {
    return this.patch(`/api/workspaces/${workspaceSlug}/teams/${teamId}/user-properties/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
