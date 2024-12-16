// plane constants
import { API_BASE_URL } from "@plane/constants";
// plane types
import { TTeamView, TPublishViewSettings, TIssuesResponse, TTeamScope } from "@plane/types";
// constants
import { EViewAccess } from "@/constants/views";
// helpers
import { APIService } from "@/services/api.service";

export class TeamViewService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  /**
   * Create a new view for a team
   * @param workspaceSlug
   * @param teamId
   * @param data
   * @returns
   */
  async createView(workspaceSlug: string, teamId: string, data: Partial<TTeamView>): Promise<TTeamView> {
    return this.post(`/api/workspaces/${workspaceSlug}/teams/${teamId}/views/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Update a view for a team
   * @param workspaceSlug
   * @param teamId
   * @param viewId
   * @param data
   * @returns
   */
  async patchView(workspaceSlug: string, teamId: string, viewId: string, data: Partial<TTeamView>): Promise<TTeamView> {
    return this.patch(`/api/workspaces/${workspaceSlug}/teams/${teamId}/views/${viewId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Delete a view for a team
   * @param workspaceSlug
   * @param teamId
   * @param viewId
   * @returns
   */
  async deleteView(workspaceSlug: string, teamId: string, viewId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/teams/${teamId}/views/${viewId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Get all views for a team
   * @param workspaceSlug
   * @param teamId
   * @returns
   */
  async getViews(workspaceSlug: string, teamId: string, scope: TTeamScope): Promise<TTeamView[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/teams/${teamId}/views/?scope=${scope}`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Get details of a view for a team
   * @param workspaceSlug
   * @param teamId
   * @param viewId
   * @returns
   */
  async getViewDetails(workspaceSlug: string, teamId: string, viewId: string): Promise<TTeamView> {
    return this.get(`/api/workspaces/${workspaceSlug}/teams/${teamId}/views/${viewId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Get issues of a view for a team
   * @param workspaceSlug
   * @param teamId
   * @param viewId
   * @returns
   */
  async getViewIssues(workspaceSlug: string, teamId: string, viewId: string): Promise<TIssuesResponse> {
    return this.get(`/api/workspaces/${workspaceSlug}/teams/${teamId}/views/${viewId}/issues/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Add a view to favorites for a team
   * @param workspaceSlug
   * @param teamId
   * @param data
   * @returns
   */
  async addViewToFavorites(
    workspaceSlug: string,
    teamId: string,
    data: {
      view: string;
    }
  ): Promise<void> {
    return this.post(`/api/workspaces/${workspaceSlug}/teams/${teamId}/user-favorite-views/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Remove a view from favorites for a team
   * @param workspaceSlug
   * @param teamId
   * @param viewId
   * @returns
   */
  async removeViewFromFavorites(workspaceSlug: string, teamId: string, viewId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/teams/${teamId}/user-favorite-views/${viewId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Update access of a view for a team
   * @param workspaceSlug
   * @param teamId
   * @param viewId
   * @param access
   * @returns
   */
  async updateViewAccess(workspaceSlug: string, teamId: string, viewId: string, access: EViewAccess): Promise<void> {
    return await this.post(`/api/workspaces/${workspaceSlug}/teams/${teamId}/views/${viewId}/access/`, {
      access,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Lock a view for a team
   * @param workspaceSlug
   * @param teamId
   * @param viewId
   * @returns
   */
  async lockView(workspaceSlug: string, teamId: string, viewId: string): Promise<void> {
    return await this.post(`/api/workspaces/${workspaceSlug}/teams/${teamId}/views/${viewId}/lock/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Unlock a view for a team
   * @param workspaceSlug
   * @param teamId
   * @param viewId
   * @returns
   */
  async unLockView(workspaceSlug: string, teamId: string, viewId: string): Promise<void> {
    return await this.delete(`/api/workspaces/${workspaceSlug}/teams/${teamId}/views/${viewId}/lock/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Get publish details of a view for a team
   * @param workspaceSlug
   * @param teamId
   * @param viewId
   * @returns
   */
  async getPublishDetails(workspaceSlug: string, teamId: string, viewId: string) {
    return await this.get(`/api/workspaces/${workspaceSlug}/teams/${teamId}/views/${viewId}/publish/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Publish a view for a team
   * @param workspaceSlug
   * @param teamId
   * @param viewId
   * @param data
   * @returns
   */
  async publishView(workspaceSlug: string, teamId: string, viewId: string, data: TPublishViewSettings) {
    return await this.post(`/api/workspaces/${workspaceSlug}/teams/${teamId}/views/${viewId}/publish/`, {
      ...data,
      view_props: {
        list: true,
        kanban: true,
        calendar: true,
        gantt: true,
        spreadsheet: true,
      },
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Update published view for a team
   * @param workspaceSlug
   * @param teamId
   * @param viewId
   * @param data
   * @returns
   */
  async updatePublishedView(
    workspaceSlug: string,
    teamId: string,
    viewId: string,
    data: Partial<TPublishViewSettings>
  ) {
    return await this.patch(`/api/workspaces/${workspaceSlug}/teams/${teamId}/views/${viewId}/publish/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Unpublish a view for a team
   * @param workspaceSlug
   * @param teamId
   * @param viewId
   * @returns
   */
  async unPublishView(workspaceSlug: string, teamId: string, viewId: string) {
    return await this.delete(`/api/workspaces/${workspaceSlug}/teams/${teamId}/views/${viewId}/publish/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
