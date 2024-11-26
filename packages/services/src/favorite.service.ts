import type { IFavorite } from "@plane/types";
// services
import APIService from "./api.service";

export default class FavoriteService extends APIService {
  /**
   * Creates an instance of FavoriteService
   * @param {string} baseURL - The base URL for API requests
   */
  constructor(baseURL: string) {
    super(baseURL);
  }

  /**
   * Adds a new favorite item to the workspace
   * @param {string} workspaceSlug - The unique identifier for the workspace
   * @param {Partial<IFavorite>} data - The favorite item data to be added
   * @returns {Promise<IFavorite>} The created favorite item
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
   * @param {string} workspaceSlug - The unique identifier for the workspace
   * @param {string} favoriteId - The ID of the favorite item to update
   * @param {Partial<IFavorite>} data - The updated favorite item data
   * @returns {Promise<IFavorite>} The updated favorite item
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
   * Deletes a favorite item
   * @param {string} workspaceSlug - The unique identifier for the workspace
   * @param {string} favoriteId - The ID of the favorite item to delete
   * @returns {Promise<void>}
   * @throws {Error} If the API request fails
   */
  async destroy(workspaceSlug: string, favoriteId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/user-favorites/${favoriteId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  /**
   * Retrieves all favorite items in a workspace
   * @param {string} workspaceSlug - The unique identifier for the workspace
   * @returns {Promise<IFavorite[]>} Array of favorite items
   * @throws {Error} If the API request fails
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
   * @param {string} workspaceSlug - The unique identifier for the workspace
   * @param {string} favoriteId - The ID of the favorite item to get grouped items for
   * @returns {Promise<IFavorite[]>} Array of grouped favorite items
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
