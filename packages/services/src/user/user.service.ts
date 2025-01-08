// plane imports
import { API_BASE_URL } from "@plane/constants";
import type { IUser } from "@plane/types";
// api service
import { APIService } from "../api.service";

/**
 * Service class for managing user operations
 * Handles operations for retrieving the current user's details and perform CRUD operations
 * @extends {APIService}
 */
export class UserService extends APIService {
  /**
   * Constructor for UserService
   * @param BASE_URL - Base URL for API requests
   */
  constructor(BASE_URL?: string) {
    super(BASE_URL || API_BASE_URL);
  }

  /**
   * Retrieves the current instance admin details
   * @returns {Promise<IUser>} Promise resolving to the current instance admin details
   * @throws {Error} If the API request fails
   * @remarks This method uses the validateStatus: null option to bypass interceptors for unauthorized errors.
   */
  async adminDetails(): Promise<IUser> {
    return this.get("/api/instances/admins/me/", { validateStatus: null })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
