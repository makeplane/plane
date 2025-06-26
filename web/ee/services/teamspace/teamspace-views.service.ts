// plane constants
import { EViewAccess, API_BASE_URL } from "@plane/constants";
// plane types
import { TTeamspaceView, TPublishViewSettings, TIssuesResponse } from "@plane/types";
// helpers
import { APIService } from "@/services/api.service";

export class TeamspaceViewService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  /**
   * Create a new view for a teamspace
   * @param workspaceSlug
   * @param teamspaceId
   * @param data
   * @returns
   */
  async createView(workspaceSlug: string, teamspaceId: string, data: Partial<TTeamspaceView>): Promise<TTeamspaceView> {
    return this.post(`/api/workspaces/${workspaceSlug}/teamspaces/${teamspaceId}/views/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Update a view for a teamspace
   * @param workspaceSlug
   * @param teamspaceId
   * @param viewId
   * @param data
   * @returns
   */
  async patchView(
    workspaceSlug: string,
    teamspaceId: string,
    viewId: string,
    data: Partial<TTeamspaceView>
  ): Promise<TTeamspaceView> {
    return this.patch(`/api/workspaces/${workspaceSlug}/teamspaces/${teamspaceId}/views/${viewId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Delete a view for a teamspace
   * @param workspaceSlug
   * @param teamspaceId
   * @param viewId
   * @returns
   */
  async deleteView(workspaceSlug: string, teamspaceId: string, viewId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/teamspaces/${teamspaceId}/views/${viewId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Get all views for a teamspace
   * @param workspaceSlug
   * @param teamspaceId
   * @returns
   */
  async getViews(workspaceSlug: string, teamspaceId: string): Promise<TTeamspaceView[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/teamspaces/${teamspaceId}/views/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Get details of a view for a teamspace
   * @param workspaceSlug
   * @param teamspaceId
   * @param viewId
   * @returns
   */
  async getViewDetails(workspaceSlug: string, teamspaceId: string, viewId: string): Promise<TTeamspaceView> {
    return this.get(`/api/workspaces/${workspaceSlug}/teamspaces/${teamspaceId}/views/${viewId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Get issues of a view for a teamspace
   * @param workspaceSlug
   * @param teamspaceId
   * @param viewId
   * @returns
   */
  async getViewIssues(workspaceSlug: string, teamspaceId: string, viewId: string): Promise<TIssuesResponse> {
    return this.get(`/api/workspaces/${workspaceSlug}/teamspaces/${teamspaceId}/views/${viewId}/issues/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Add a view to favorites for a teamspace
   * @param workspaceSlug
   * @param teamspaceId
   * @param data
   * @returns
   */
  async addViewToFavorites(
    workspaceSlug: string,
    teamspaceId: string,
    data: {
      view: string;
    }
  ): Promise<void> {
    return this.post(`/api/workspaces/${workspaceSlug}/teamspaces/${teamspaceId}/user-favorite-views/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Remove a view from favorites for a teamspace
   * @param workspaceSlug
   * @param teamspaceId
   * @param viewId
   * @returns
   */
  async removeViewFromFavorites(workspaceSlug: string, teamspaceId: string, viewId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/teamspaces/${teamspaceId}/user-favorite-views/${viewId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Update access of a view for a teamspace
   * @param workspaceSlug
   * @param teamspaceId
   * @param viewId
   * @param access
   * @returns
   */
  async updateViewAccess(
    workspaceSlug: string,
    teamspaceId: string,
    viewId: string,
    access: EViewAccess
  ): Promise<void> {
    return await this.post(`/api/workspaces/${workspaceSlug}/teamspaces/${teamspaceId}/views/${viewId}/access/`, {
      access,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Lock a view for a teamspace
   * @param workspaceSlug
   * @param teamspaceId
   * @param viewId
   * @returns
   */
  async lockView(workspaceSlug: string, teamspaceId: string, viewId: string): Promise<void> {
    return await this.post(`/api/workspaces/${workspaceSlug}/teamspaces/${teamspaceId}/views/${viewId}/lock/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Unlock a view for a teamspace
   * @param workspaceSlug
   * @param teamspaceId
   * @param viewId
   * @returns
   */
  async unLockView(workspaceSlug: string, teamspaceId: string, viewId: string): Promise<void> {
    return await this.delete(`/api/workspaces/${workspaceSlug}/teamspaces/${teamspaceId}/views/${viewId}/lock/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Get publish details of a view for a teamspace
   * @param workspaceSlug
   * @param teamspaceId
   * @param viewId
   * @returns
   */
  async getPublishDetails(workspaceSlug: string, teamspaceId: string, viewId: string) {
    return await this.get(`/api/workspaces/${workspaceSlug}/teamspaces/${teamspaceId}/views/${viewId}/publish/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Publish a view for a teamspace
   * @param workspaceSlug
   * @param teamspaceId
   * @param viewId
   * @param data
   * @returns
   */
  async publishView(workspaceSlug: string, teamspaceId: string, viewId: string, data: TPublishViewSettings) {
    return await this.post(`/api/workspaces/${workspaceSlug}/teamspaces/${teamspaceId}/views/${viewId}/publish/`, {
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
   * Update published view for a teamspace
   * @param workspaceSlug
   * @param teamspaceId
   * @param viewId
   * @param data
   * @returns
   */
  async updatePublishedView(
    workspaceSlug: string,
    teamspaceId: string,
    viewId: string,
    data: Partial<TPublishViewSettings>
  ) {
    return await this.patch(`/api/workspaces/${workspaceSlug}/teamspaces/${teamspaceId}/views/${viewId}/publish/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Unpublish a view for a teamspace
   * @param workspaceSlug
   * @param teamspaceId
   * @param viewId
   * @returns
   */
  async unPublishView(workspaceSlug: string, teamspaceId: string, viewId: string) {
    return await this.delete(`/api/workspaces/${workspaceSlug}/teamspaces/${teamspaceId}/views/${viewId}/publish/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
