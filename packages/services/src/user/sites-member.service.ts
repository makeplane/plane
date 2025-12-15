// plane imports
import { API_BASE_URL } from "@plane/constants";
import type { TPublicMember } from "@plane/types";
// api service
import { APIService } from "../api.service";

/**
 * Service class for managing members operations within plane sites application.
 * Extends APIService to handle HTTP requests to the member-related endpoints.
 * @extends {APIService}
 * @remarks This service is only available for plane sites
 */
export class SitesMemberService extends APIService {
  constructor(BASE_URL?: string) {
    super(BASE_URL || API_BASE_URL);
  }

  /**
   * Retrieves a list of members for a specific anchor.
   * @param {string} anchor - The anchor identifier
   * @returns {Promise<TPublicMember[]>} The list of members
   * @throws {Error} If the API request fails
   */
  async list(anchor: string): Promise<TPublicMember[]> {
    return this.get(`/api/public/anchor/${anchor}/members/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
