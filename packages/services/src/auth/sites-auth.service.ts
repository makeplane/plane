import { API_BASE_URL } from "@plane/constants";
// types
import type { IEmailCheckData, IEmailCheckResponse } from "@plane/types";
// services
import { APIService } from "../api.service";

/**
 * Service class for handling authentication-related operations for Plane space application
 * Provides methods for user authentication, password management, and session handling
 * @extends {APIService}
 * @remarks This service is only available for plane sites
 */
export class SitesAuthService extends APIService {
  /**
   * Creates an instance of SitesAuthService
   * Initializes with the base API URL
   */
  constructor(BASE_URL?: string) {
    super(BASE_URL || API_BASE_URL);
  }

  /**
   * Checks if an email exists in the system
   * @param {IEmailCheckData} data - Email data to verify
   * @returns {Promise<IEmailCheckResponse>} Response indicating email status
   * @throws {Error} Throws response data if the request fails
   */
  async emailCheck(data: IEmailCheckData): Promise<IEmailCheckResponse> {
    return this.post("/auth/spaces/email-check/", data, { headers: {} })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Generates a unique code for magic link authentication
   * @param {{ email: string }} data - Object containing the email address
   * @returns {Promise<any>} Response containing the generated unique code
   * @throws {Error} Throws response data if the request fails
   */
  async generateUniqueCode(data: { email: string }): Promise<any> {
    return this.post("/auth/spaces/magic-generate/", data, { headers: {} })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
