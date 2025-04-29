// plane constants
import { API_BASE_URL, ETeamspaceEntityScope } from "@plane/constants";
// plane types
import { TPage, TDocumentPayload } from "@plane/types";
// helpers;
import { APIService } from "@/services/api.service";

export class TeamspacePageService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  /**
   * Get all pages for a teamspace
   * @param workspaceSlug
   * @param teamspaceId
   * @returns
   */
  async fetchAll(workspaceSlug: string, teamspaceId: string, scope: ETeamspaceEntityScope): Promise<TPage[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/teamspaces/${teamspaceId}/pages/?scope=${scope}`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Get details of a page for a teamspace
   * @param workspaceSlug
   * @param teamspaceId
   * @param pageId
   * @returns
   */
  async fetchById(workspaceSlug: string, teamspaceId: string, pageId: string): Promise<TPage> {
    return this.get(`/api/workspaces/${workspaceSlug}/teamspaces/${teamspaceId}/pages/${pageId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Create a new page for a teamspace
   * @param workspaceSlug
   * @param teamspaceId
   * @param data
   * @returns
   */
  async create(workspaceSlug: string, teamspaceId: string, data: Partial<TPage>): Promise<TPage> {
    return this.post(`/api/workspaces/${workspaceSlug}/teamspaces/${teamspaceId}/pages/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Update a page for a teamspace
   * @param workspaceSlug
   * @param teamspaceId
   * @param pageId
   * @param data
   * @returns
   */
  async update(workspaceSlug: string, teamspaceId: string, pageId: string, data: Partial<TPage>): Promise<TPage> {
    return this.patch(`/api/workspaces/${workspaceSlug}/teamspaces/${teamspaceId}/pages/${pageId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Update access of a page for a teamspace
   * @param workspaceSlug
   * @param teamspaceId
   * @param pageId
   * @param access
   * @returns
   */
  async updateAccess(workspaceSlug: string, teamspaceId: string, pageId: string, data: Partial<TPage>): Promise<void> {
    return await this.post(`/api/workspaces/${workspaceSlug}/teamspaces/${teamspaceId}/pages/${pageId}/access/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Delete a page for a teamspace
   * @param workspaceSlug
   * @param teamspaceId
   * @param pageId
   * @returns
   */
  async remove(workspaceSlug: string, teamspaceId: string, pageId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/teamspaces/${teamspaceId}/pages/${pageId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Add a page to favorites for a teamspace
   * @param workspaceSlug
   * @param teamspaceId
   * @param pageId
   * @returns
   */
  async addToFavorites(workspaceSlug: string, teamspaceId: string, pageId: string): Promise<void> {
    return this.post(`/api/workspaces/${workspaceSlug}/teamspaces/${teamspaceId}/pages/${pageId}/favorite/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Remove a page from favorites for a teamspace
   * @param workspaceSlug
   * @param teamspaceId
   * @param pageId
   * @returns
   */
  async removeFromFavorites(workspaceSlug: string, teamspaceId: string, pageId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/teamspaces/${teamspaceId}/pages/${pageId}/favorite/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Archive a page for a teamspace
   * @param workspaceSlug
   * @param teamspaceId
   * @param pageId
   * @returns
   */
  async archive(
    workspaceSlug: string,
    teamspaceId: string,
    pageId: string
  ): Promise<{
    archived_at: string;
  }> {
    return await this.post(`/api/workspaces/${workspaceSlug}/teamspaces/${teamspaceId}/pages/${pageId}/archive/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Restore a page for a teamspace
   * @param workspaceSlug
   * @param teamspaceId
   * @param pageId
   * @returns
   */
  async restore(workspaceSlug: string, teamspaceId: string, pageId: string): Promise<void> {
    return await this.post(`/api/workspaces/${workspaceSlug}/teamspaces/${teamspaceId}/pages/${pageId}/unarchive/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Lock a page for a teamspace
   * @param workspaceSlug
   * @param teamspaceId
   * @param pageId
   * @returns
   */
  async lock(workspaceSlug: string, teamspaceId: string, pageId: string): Promise<void> {
    return await this.post(`/api/workspaces/${workspaceSlug}/teamspaces/${teamspaceId}/pages/${pageId}/lock/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Unlock a page for a teamspace
   * @param workspaceSlug
   * @param teamspaceId
   * @param pageId
   * @returns
   */
  async unlock(workspaceSlug: string, teamspaceId: string, pageId: string): Promise<void> {
    return await this.delete(`/api/workspaces/${workspaceSlug}/teamspaces/${teamspaceId}/pages/${pageId}/lock/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Fetch description of a page for a teamspace
   * @param workspaceSlug
   * @param teamspaceId
   * @param pageId
   * @returns
   */
  async fetchDescriptionBinary(workspaceSlug: string, teamspaceId: string, pageId: string): Promise<any> {
    return this.get(`/api/workspaces/${workspaceSlug}/teamspaces/${teamspaceId}/pages/${pageId}/description/`, {
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
   * Update description of a page for a teamspace
   * @param workspaceSlug
   * @param teamspaceId
   * @param pageId
   * @param data
   * @returns
   */
  async updateDescription(
    workspaceSlug: string,
    teamspaceId: string,
    pageId: string,
    data: TDocumentPayload
  ): Promise<any> {
    return this.patch(`/api/workspaces/${workspaceSlug}/teamspaces/${teamspaceId}/pages/${pageId}/description/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Duplicate a page for a teamspace
   * @param workspaceSlug
   * @param teamspaceId
   * @param pageId
   * @returns
   */
  async duplicate(workspaceSlug: string, teamspaceId: string, pageId: string): Promise<TPage> {
    return this.post(`/api/workspaces/${workspaceSlug}/teamspaces/${teamspaceId}/pages/${pageId}/duplicate/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Fetch sub-pages for a teamspace page
   * @param workspaceSlug
   * @param teamspaceId
   * @param pageId
   * @returns
   */
  async fetchSubPages(workspaceSlug: string, teamspaceId: string, pageId: string): Promise<TPage[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/teamspaces/${teamspaceId}/pages/${pageId}/sub-pages`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
