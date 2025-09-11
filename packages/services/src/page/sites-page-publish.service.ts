// plane imports
import { API_BASE_URL } from "@plane/constants";
import { IPublicIssue, TPublicPageResponse } from "@plane/types";
// api service
import { APIService } from "../api.service";

/**
 * Service class for managing page publish operations within plane sites application.
 * Extends APIService to handle HTTP requests to the page publish-related endpoints.
 * @extends {APIService}
 * @remarks This service is only available for plane sites enterprise edition
 */
export class SitesPagePublishService extends APIService {
  constructor(BASE_URL?: string) {
    super(BASE_URL || API_BASE_URL);
  }

  /**
   * Retrieves page details for a specific anchor.
   * @param {string} anchor - The anchor identifier
   * @returns {Promise<TPublicPageResponse>} The page details
   * @throws {Error} If the API request fails
   */
  async retrieve(anchor: string): Promise<TPublicPageResponse> {
    return this.get(`/api/public/anchor/${anchor}/pages/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  /**
   * Retrieves page issue embeds for a specific anchor.
   * @param {string} anchor - The anchor identifier
   * @returns {Promise<IPublicIssue[]>} The page issue embeds
   * @throws {Error} If the API request fails
   */
  async listIssueEmbeds(anchor: string): Promise<IPublicIssue[]> {
    return this.get(`/api/public/anchor/${anchor}/page-issues/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  /**
   * Retrieves subpages for a specific page.
   * @param {string} anchor - The anchor identifier
   * @param {string} pageId - The parent page identifier
   * @returns {Promise<TPublicPageResponse[]>} The subpages list
   * @throws {Error} If the API request fails
   */
  async fetchSubPages(anchor: string): Promise<TPublicPageResponse[]> {
    return this.get(`/api/public/anchor/${anchor}/sub-pages/`)
      .then((response) => response?.data || [])
      .catch((error) => {
        throw error?.response;
      });
  }
}
