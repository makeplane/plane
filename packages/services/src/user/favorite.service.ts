import { API_BASE_URL } from "@plane/constants";
import type { IFavorite } from "@plane/types";
import { APIService } from "../api.service";

/**
 * Service class for managing user favorites
 * Handles operations for adding, updating, removing, and retrieving user favorites within a workspace
 * @extends {APIService}
 */
export class UserFavoriteService extends APIService {
  constructor(BASE_URL?: string) {
    super(BASE_URL || API_BASE_URL);
  }

  /**
   * Adds a new item to user favorites
   * @param {string} workspaceSlug - The unique slug identifier for the workspace
   * @param {Partial<IFavorite>} data - Favorite item data to be added
   * @returns {Promise<IFavorite>} Promise resolving to the created favorite item
   * @throws {Error} If the API request fails
   */
  async add(workspaceSlug: string, data: Partial<IFavorite>): Promise<IFavorite> {
    return this.post(`/api/workspaces/${workspaceSlug}/user-favorites/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  /**
   * Updates an existing favorite item
   * @param {string} workspaceSlug - The unique slug identifier for the workspace
   * @param {string} favoriteId - The unique identifier for the favorite item
   * @param {Partial<IFavorite>} data - Updated favorite item data
   * @returns {Promise<IFavorite>} Promise resolving to the updated favorite item
   * @throws {Error} If the API request fails
   */
  async update(workspaceSlug: string, favoriteId: string, data: Partial<IFavorite>): Promise<IFavorite> {
    return this.patch(`/api/workspaces/${workspaceSlug}/user-favorites/${favoriteId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  /**
   * Removes an item from user favorites
   * @param {string} workspaceSlug - The unique slug identifier for the workspace
   * @param {string} favoriteId - The unique identifier for the favorite item to remove
   * @returns {Promise<void>} Promise resolving when the favorite item is removed
   * @throws {Error} If the API request fails
   */
  async remove(workspaceSlug: string, favoriteId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/user-favorites/${favoriteId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  /**
   * Retrieves all favorite items for a user in a workspace
   * @param {string} workspaceSlug - The unique slug identifier for the workspace
   * @returns {Promise<IFavorite[]>} Promise resolving to array of favorite items
   * @throws {Error} If the API request fails
   * @remarks This method includes the 'all' parameter to retrieve all favorites
   */
  async list(workspaceSlug: string): Promise<IFavorite[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/user-favorites/`, {
      params: {
        all: true,
      },
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Retrieves grouped favorite items for a specific favorite in a workspace
   * @param {string} workspaceSlug - The unique slug identifier for the workspace
   * @param {string} favoriteId - The unique identifier for the favorite item to get grouped items for
   * @returns {Promise<IFavorite[]>} Promise resolving to array of grouped favorite items
   * @throws {Error} If the API request fails
   */
  async groupedList(workspaceSlug: string, favoriteId: string): Promise<IFavorite[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/user-favorites/${favoriteId}/group/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
