// plane imports
import { API_BASE_URL } from "@plane/constants";
import type { IUser, TUserProfile } from "@plane/types";
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
   * Retrieves the current user details
   * @returns {Promise<IUser>} Promise resolving to the current user details
   */
  async me(): Promise<IUser> {
    return this.get("/api/users/me/")
      .then((response) => response?.data)
      .catch((error) => {
        throw error;
      });
  }

  /**
   * Updates the current user details
   * @param {Partial<IUser>} data Data to update the user with
   * @returns {Promise<IUser>} Promise resolving to the updated user details
   * @throws {Error} If the API request fails
   */
  async update(data: Partial<IUser>): Promise<IUser> {
    return this.patch("/api/users/me/", data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Retrieves the current user's profile details
   * @returns {Promise<TUserProfile>} Promise resolving to the current user's profile details
   * @throws {Error} If the API request fails
   */
  async profile(): Promise<TUserProfile> {
    return this.get("/api/users/me/profile/")
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  /**
   * Updates the current user's profile details
   * @param {Partial<TUserProfile>} data Data to update the user's profile with
   * @returns {Promise<TUserProfile>} Promise resolving to the updated user's profile details
   * @throws {Error} If the API request fails
   */
  async updateProfile(data: Partial<TUserProfile>): Promise<TUserProfile> {
    return this.patch("/api/users/me/profile/", data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  /**
   * Retrieves the current instance admin details
   * @returns {Promise<IUser>} Promise resolving to the current instance admin details
   * @throws {Error} If the API request fails
   */
  async adminDetails(): Promise<IUser> {
    return this.get("/api/instances/admins/me/")
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
