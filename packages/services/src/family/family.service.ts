import { API_BASE_URL } from "@plane/constants";
import type { IFamily, IFamilyFormData } from "@plane/types";
import { APIService } from "../api.service";

/**
 * Service class for managing Family operations
 * Handles CRUD operations for families
 * @extends {APIService}
 */
export class FamilyService extends APIService {
  /**
   * Creates an instance of FamilyService
   * @param {string} baseUrl - The base URL for API requests
   */
  constructor(BASE_URL?: string) {
    super(BASE_URL || API_BASE_URL);
  }

  /**
   * Retrieves all families for the current user
   * @returns {Promise<IFamily[]>} Promise resolving to an array of families
   * @throws {Error} If the API request fails
   */
  async getFamilies(): Promise<IFamily[]> {
    return this.get("/api/families/")
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Retrieves details of a specific family
   * @param {string} familyId - The unique ID for the family
   * @returns {Promise<IFamily>} Promise resolving to family details
   * @throws {Error} If the API request fails
   */
  async getFamily(familyId: string): Promise<IFamily> {
    return this.get(`/api/families/${familyId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Creates a new family
   * @param {IFamilyFormData} data - Family data for creation
   * @returns {Promise<IFamily>} Promise resolving to the created family
   * @throws {Error} If the API request fails
   */
  async createFamily(data: IFamilyFormData): Promise<IFamily> {
    return this.post("/api/families/", data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Updates an existing family
   * @param {string} familyId - The unique ID for the family
   * @param {Partial<IFamilyFormData>} data - Updated family data
   * @returns {Promise<IFamily>} Promise resolving to the updated family
   * @throws {Error} If the API request fails
   */
  async updateFamily(familyId: string, data: Partial<IFamilyFormData>): Promise<IFamily> {
    return this.patch(`/api/families/${familyId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Deletes a family
   * @param {string} familyId - The unique ID for the family
   * @returns {Promise<any>} Promise resolving to the deletion response
   * @throws {Error} If the API request fails
   */
  async deleteFamily(familyId: string): Promise<any> {
    return this.delete(`/api/families/${familyId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

