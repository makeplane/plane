// plane imports
import { API_BASE_URL } from "@plane/constants";
// api service
import type { TDuplicateAssetData, TDuplicateAssetResponse } from "@plane/types";
import { APIService } from "../api.service";
// helpers
import { getAssetIdFromUrl } from "./helper";

/**
 * Service class for managing file operations within plane applications.
 * Extends APIService to handle HTTP requests to the file-related endpoints.
 * @extends {APIService}
 */
export class FileService extends APIService {
  /**
   * Creates an instance of FileService
   * @param {string} BASE_URL - The base URL for API requests
   */
  constructor(BASE_URL?: string) {
    super(BASE_URL || API_BASE_URL);
  }

  /**
   * Deletes a new asset
   * @param {string} assetPath - The asset path
   * @returns {Promise<void>} Promise resolving to void
   * @throws {Error} If the request fails
   */
  async deleteNewAsset(assetPath: string): Promise<void> {
    return this.delete(assetPath)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Deletes an old editor asset
   * @param {string} workspaceId - The workspace identifier
   * @param {string} src - The asset source
   * @returns {Promise<any>} Promise resolving to void
   * @throws {Error} If the request fails
   */
  async deleteOldEditorAsset(workspaceId: string, src: string): Promise<any> {
    const assetKey = getAssetIdFromUrl(src);
    return this.delete(`/api/workspaces/file-assets/${workspaceId}/${assetKey}/`)
      .then((response) => response?.status)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Restores an old editor asset
   * @param {string} workspaceId - The workspace identifier
   * @param {string} src - The asset source
   * @returns {Promise<void>} Promise resolving to void
   * @throws {Error} If the request fails
   */
  async restoreOldEditorAsset(workspaceId: string, src: string): Promise<void> {
    const assetKey = getAssetIdFromUrl(src);
    return this.post(`/api/workspaces/file-assets/${workspaceId}/${assetKey}/restore/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Duplicates assets
   * @param {string} workspaceSlug - The workspace slug
   * @param {TDuplicateAssetData} data - The data for the duplicate assets
   * @returns {Promise<TDuplicateAssetResponse>} Promise resolving to a record of asset IDs
   * @throws {Error} If the request fails
   */
  async duplicateAssets(workspaceSlug: string, data: TDuplicateAssetData): Promise<TDuplicateAssetResponse> {
    return this.post(`/api/assets/v2/workspaces/${workspaceSlug}/duplicate-assets/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
