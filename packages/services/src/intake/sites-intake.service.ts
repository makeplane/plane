// plane imports
import { API_BASE_URL } from "@plane/constants";
import { TIntakeIssueForm } from "@plane/types";
// api service
import { APIService } from "../api.service";

/**
 * Service class for managing intake operations within plane sites application.
 * Extends APIService to handle HTTP requests to the intake-related endpoints.
 * @extends {APIService}
 * @remarks This service is only available for plane sites enterprise edition
 */
export class SitesIntakeService extends APIService {
  constructor(BASE_URL?: string) {
    super(BASE_URL || API_BASE_URL);
  }

  /**
   * Publishes an intake form to the specified anchor.
   * @param {string} anchor - The anchor identifier
   * @param {Partial<TIntakeIssueForm>} data - The intake form data
   * @returns {Promise<TIntakeIssueForm>} The intake form data
   * @throws {Error} If the API request fails
   */
  async publishForm(anchor: string, data: Partial<TIntakeIssueForm>): Promise<TIntakeIssueForm> {
    return this.post(`/api/public/anchor/${anchor}/intake/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
