// plane imports
import { API_BASE_URL } from "@plane/constants";
import { IPublishedProjectView } from "@plane/types";
// api service
import { APIService } from "../api.service";

/**
 * Service class for managing view publish operations within plane sites application.
 * Extends APIService to handle HTTP requests to the view publish-related endpoints.
 * @extends {APIService}
 * @remarks This service is only available for plane sites enterprise edition
 */
export class SitesViewPublishService extends APIService {
  constructor(BASE_URL?: string) {
    super(BASE_URL || API_BASE_URL);
  }

  /**
   * Retrieves publish settings for a specific anchor.
   * @param {string} anchor - The anchor identifier
   * @returns {Promise<IPublishedProjectView>} The publish settings
   * @throws {Error} If the API request fails
   */
  async retrieve(anchor: string): Promise<IPublishedProjectView> {
    return this.get(`/api/public/anchor/${anchor}/views/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Retrieves view issues for a specific anchor.
   * @param {string} anchor - The anchor identifier
   * @param {any} params - The query parameters
   * @returns {Promise<any>} The issues
   * @throws {Error} If the API request fails
   */
  async listIssues(anchor: string, params: any): Promise<any> {
    return this.get(`/api/public/anchor/${anchor}/view-issues/`, {
      params,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
