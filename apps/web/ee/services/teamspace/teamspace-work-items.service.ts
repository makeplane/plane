// types
import type { IIssueFiltersResponse, TIssuesResponse } from "@plane/types";
// helpers
import { API_BASE_URL  } from "@plane/constants";
// services
import { APIService } from "@/services/api.service";

export class TeamspaceWorkItemsService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getWorkItemsFromServer(
    workspaceSlug: string,
    teamspaceId: string,
    queries?: any,
    config = {}
  ): Promise<TIssuesResponse> {
    const path =
      (queries.expand as string)?.includes("issue_relation") && !queries.group_by
        ? `/api/workspaces/${workspaceSlug}/teamspaces/${teamspaceId}/issues-detail/`
        : `/api/workspaces/${workspaceSlug}/teamspaces/${teamspaceId}/issues/`;
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

  // teamspace work items
  async getWorkItems(workspaceSlug: string, teamspaceId: string, queries?: any, config = {}): Promise<TIssuesResponse> {
    // if (!isEmpty(queries.expand as string) && !queries.group_by)
    return await this.getWorkItemsFromServer(workspaceSlug, teamspaceId, queries, config);
  }

  // teamspace work item filters
  async fetchTeamspaceWorkItemFilters(workspaceSlug: string, teamspaceId: string): Promise<IIssueFiltersResponse> {
    return this.get(`/api/workspaces/${workspaceSlug}/teamspaces/${teamspaceId}/user-properties/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async patchTeamspaceWorkItemFilters(
    workspaceSlug: string,
    teamspaceId: string,
    data: Partial<IIssueFiltersResponse>
  ): Promise<void> {
    return this.patch(`/api/workspaces/${workspaceSlug}/teamspaces/${teamspaceId}/user-properties/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
