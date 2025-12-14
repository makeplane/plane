import { API_BASE_URL } from "@plane/constants";
import type { IBacklogItem, IBacklogItemFormData, IBacklogReorderPayload } from "@plane/types";
import { APIService } from "../api.service";

/**
 * Service class for managing Backlog operations
 * Handles CRUD operations for backlog items within a family
 * @extends {APIService}
 */
export class BacklogService extends APIService {
  /**
   * Creates an instance of BacklogService
   * @param {string} baseUrl - The base URL for API requests
   */
  constructor(BASE_URL?: string) {
    super(BASE_URL || API_BASE_URL);
  }

  /**
   * Retrieves all backlog items for a family
   * @param {string} familyId - The unique ID for the family
   * @param {Object} params - Optional query parameters (category, status, etc.)
   * @returns {Promise<IBacklogItem[]>} Promise resolving to an array of backlog items
   * @throws {Error} If the API request fails
   */
  async getBacklog(familyId: string, params?: { category?: string; status?: string }): Promise<IBacklogItem[]> {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append("category", params.category);
    if (params?.status) queryParams.append("status", params.status);
    
    const queryString = queryParams.toString();
    const url = `/api/families/${familyId}/backlog${queryString ? `?${queryString}` : ""}`;
    
    return this.get(url)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Retrieves details of a specific backlog item
   * @param {string} familyId - The unique ID for the family
   * @param {string} itemId - The unique ID for the backlog item
   * @returns {Promise<IBacklogItem>} Promise resolving to backlog item details
   * @throws {Error} If the API request fails
   */
  async getItem(familyId: string, itemId: string): Promise<IBacklogItem> {
    return this.get(`/api/families/${familyId}/backlog/${itemId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Creates a new backlog item
   * @param {string} familyId - The unique ID for the family
   * @param {IBacklogItemFormData} data - Backlog item data for creation
   * @returns {Promise<IBacklogItem>} Promise resolving to the created backlog item
   * @throws {Error} If the API request fails
   */
  async createItem(familyId: string, data: IBacklogItemFormData): Promise<IBacklogItem> {
    return this.post(`/api/families/${familyId}/backlog/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Updates an existing backlog item
   * @param {string} familyId - The unique ID for the family
   * @param {string} itemId - The unique ID for the backlog item
   * @param {Partial<IBacklogItemFormData>} data - Updated backlog item data
   * @returns {Promise<IBacklogItem>} Promise resolving to the updated backlog item
   * @throws {Error} If the API request fails
   */
  async updateItem(familyId: string, itemId: string, data: Partial<IBacklogItemFormData>): Promise<IBacklogItem> {
    return this.patch(`/api/families/${familyId}/backlog/${itemId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Deletes a backlog item
   * @param {string} familyId - The unique ID for the family
   * @param {string} itemId - The unique ID for the backlog item
   * @returns {Promise<any>} Promise resolving to the deletion response
   * @throws {Error} If the API request fails
   */
  async deleteItem(familyId: string, itemId: string): Promise<any> {
    return this.delete(`/api/families/${familyId}/backlog/${itemId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Reorders backlog items by updating their priority values
   * @param {string} familyId - The unique ID for the family
   * @param {IBacklogReorderPayload} data - Payload containing ordered list of item IDs
   * @returns {Promise<any>} Promise resolving to the reorder response
   * @throws {Error} If the API request fails
   */
  async reorderItems(familyId: string, data: IBacklogReorderPayload): Promise<any> {
    return this.post(`/api/families/${familyId}/backlog/reorder/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

