import { API_BASE_URL } from "@plane/constants";
import { IApiToken } from "@plane/types";
import { APIService } from "../api.service";

export class APITokenService extends APIService {
  constructor(BASE_URL?: string) {
    super(BASE_URL || API_BASE_URL);
  }

  /**
   * Retrieves all API tokens for a specific workspace
   * @param {string} workspaceSlug - The unique identifier for the workspace
   * @returns {Promise<IApiToken[]>} Array of API tokens associated with the workspace
   * @throws {Error} Throws response data if the request fails
   */
  async list(workspaceSlug: string): Promise<IApiToken[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/api-tokens/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Retrieves a specific API token by its ID
   * @param {string} workspaceSlug - The unique identifier for the workspace
   * @param {string} tokenId - The unique identifier of the API token
   * @returns {Promise<IApiToken>} The requested API token's details
   * @throws {Error} Throws response data if the request fails
   */
  async retrieve(workspaceSlug: string, tokenId: string): Promise<IApiToken> {
    return this.get(`/api/workspaces/${workspaceSlug}/api-tokens/${tokenId}`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Creates a new API token for a workspace
   * @param {string} workspaceSlug - The unique identifier for the workspace
   * @param {Partial<IApiToken>} data - The data for creating the new API token
   * @returns {Promise<IApiToken>} The newly created API token
   * @throws {Error} Throws response data if the request fails
   */
  async create(workspaceSlug: string, data: Partial<IApiToken>): Promise<IApiToken> {
    return this.post(`/api/workspaces/${workspaceSlug}/api-tokens/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Deletes a specific API token from the workspace
   * @param {string} workspaceSlug - The unique identifier for the workspace
   * @param {string} tokenId - The unique identifier of the API token to delete
   * @returns {Promise<IApiToken>} The deleted API token's details
   * @throws {Error} Throws response data if the request fails
   */
  async destroy(workspaceSlug: string, tokenId: string): Promise<IApiToken> {
    return this.delete(`/api/workspaces/${workspaceSlug}/api-tokens/${tokenId}`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
