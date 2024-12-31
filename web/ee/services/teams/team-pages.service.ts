// plane constants
import { API_BASE_URL } from "@plane/constants";
// plane types
import { TTeamScope, TPage, TDocumentPayload } from "@plane/types";
// helpers;
import { APIService } from "@/services/api.service";

export class TeamPageService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  /**
   * Get all pages for a team
   * @param workspaceSlug
   * @param teamId
   * @returns
   */
  async fetchAll(workspaceSlug: string, teamId: string, scope: TTeamScope): Promise<TPage[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/teams/${teamId}/pages/?scope=${scope}`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Get details of a page for a team
   * @param workspaceSlug
   * @param teamId
   * @param pageId
   * @returns
   */
  async fetchById(workspaceSlug: string, teamId: string, pageId: string): Promise<TPage> {
    return this.get(`/api/workspaces/${workspaceSlug}/teams/${teamId}/pages/${pageId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Create a new page for a team
   * @param workspaceSlug
   * @param teamId
   * @param data
   * @returns
   */
  async create(workspaceSlug: string, teamId: string, data: Partial<TPage>): Promise<TPage> {
    return this.post(`/api/workspaces/${workspaceSlug}/teams/${teamId}/pages/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Update a page for a team
   * @param workspaceSlug
   * @param teamId
   * @param pageId
   * @param data
   * @returns
   */
  async update(workspaceSlug: string, teamId: string, pageId: string, data: Partial<TPage>): Promise<TPage> {
    return this.patch(`/api/workspaces/${workspaceSlug}/teams/${teamId}/pages/${pageId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Update access of a page for a team
   * @param workspaceSlug
   * @param teamId
   * @param pageId
   * @param access
   * @returns
   */
  async updateAccess(workspaceSlug: string, teamId: string, pageId: string, data: Partial<TPage>): Promise<void> {
    return await this.post(`/api/workspaces/${workspaceSlug}/teams/${teamId}/pages/${pageId}/access/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Delete a page for a team
   * @param workspaceSlug
   * @param teamId
   * @param pageId
   * @returns
   */
  async remove(workspaceSlug: string, teamId: string, pageId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/teams/${teamId}/pages/${pageId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Add a page to favorites for a team
   * @param workspaceSlug
   * @param teamId
   * @param pageId
   * @returns
   */
  async addToFavorites(workspaceSlug: string, teamId: string, pageId: string): Promise<void> {
    return this.post(`/api/workspaces/${workspaceSlug}/teams/${teamId}/pages/${pageId}/favorite/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Remove a page from favorites for a team
   * @param workspaceSlug
   * @param teamId
   * @param pageId
   * @returns
   */
  async removeFromFavorites(workspaceSlug: string, teamId: string, pageId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/teams/${teamId}/pages/${pageId}/favorite/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Archive a page for a team
   * @param workspaceSlug
   * @param teamId
   * @param pageId
   * @returns
   */
  async archive(
    workspaceSlug: string,
    teamId: string,
    pageId: string
  ): Promise<{
    archived_at: string;
  }> {
    return await this.post(`/api/workspaces/${workspaceSlug}/teams/${teamId}/pages/${pageId}/archive/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Restore a page for a team
   * @param workspaceSlug
   * @param teamId
   * @param pageId
   * @returns
   */
  async restore(workspaceSlug: string, teamId: string, pageId: string): Promise<void> {
    return await this.post(`/api/workspaces/${workspaceSlug}/teams/${teamId}/pages/${pageId}/unarchive/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Lock a page for a team
   * @param workspaceSlug
   * @param teamId
   * @param pageId
   * @returns
   */
  async lock(workspaceSlug: string, teamId: string, pageId: string): Promise<void> {
    return await this.post(`/api/workspaces/${workspaceSlug}/teams/${teamId}/pages/${pageId}/lock/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Unlock a page for a team
   * @param workspaceSlug
   * @param teamId
   * @param pageId
   * @returns
   */
  async unlock(workspaceSlug: string, teamId: string, pageId: string): Promise<void> {
    return await this.delete(`/api/workspaces/${workspaceSlug}/teams/${teamId}/pages/${pageId}/lock/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Fetch description of a page for a team
   * @param workspaceSlug
   * @param teamId
   * @param pageId
   * @returns
   */
  async fetchDescriptionBinary(workspaceSlug: string, teamId: string, pageId: string): Promise<any> {
    return this.get(`/api/workspaces/${workspaceSlug}/teams/${teamId}/pages/${pageId}/description/`, {
      headers: {
        "Content-Type": "application/octet-stream",
      },
      responseType: "arraybuffer",
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Update description of a page for a team
   * @param workspaceSlug
   * @param teamId
   * @param pageId
   * @param data
   * @returns
   */
  async updateDescription(workspaceSlug: string, teamId: string, pageId: string, data: TDocumentPayload): Promise<any> {
    return this.patch(`/api/workspaces/${workspaceSlug}/teams/${teamId}/pages/${pageId}/description/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
