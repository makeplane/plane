import { API_BASE_URL } from "@plane/constants";
import type { IFamilyMember, IFamilyMemberFormData } from "@plane/types";
import { APIService } from "../api.service";

/**
 * Service class for managing FamilyMember operations
 * Handles CRUD operations for family members
 * @extends {APIService}
 */
export class FamilyMemberService extends APIService {
  /**
   * Creates an instance of FamilyMemberService
   * @param {string} baseUrl - The base URL for API requests
   */
  constructor(BASE_URL?: string) {
    super(BASE_URL || API_BASE_URL);
  }

  /**
   * Retrieves all members of a specific family
   * @param {string} familyId - The unique ID for the family
   * @returns {Promise<IFamilyMember[]>} Promise resolving to array of family members
   * @throws {Error} If the API request fails
   */
  async getMembers(familyId: string): Promise<IFamilyMember[]> {
    return this.get(`/api/families/${familyId}/members/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Retrieves details of a specific family member
   * @param {string} familyId - The unique ID for the family
   * @param {string} memberId - The unique ID for the member
   * @returns {Promise<IFamilyMember>} Promise resolving to member details
   * @throws {Error} If the API request fails
   */
  async getMember(familyId: string, memberId: string): Promise<IFamilyMember> {
    return this.get(`/api/families/${familyId}/members/${memberId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Adds a new member to a family
   * @param {string} familyId - The unique ID for the family
   * @param {IFamilyMemberFormData} data - Member data for creation
   * @returns {Promise<IFamilyMember>} Promise resolving to the created member
   * @throws {Error} If the API request fails
   */
  async addMember(familyId: string, data: IFamilyMemberFormData): Promise<IFamilyMember> {
    return this.post(`/api/families/${familyId}/members/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Updates an existing family member
   * @param {string} familyId - The unique ID for the family
   * @param {string} memberId - The unique ID for the member
   * @param {Partial<IFamilyMemberFormData>} data - Updated member data
   * @returns {Promise<IFamilyMember>} Promise resolving to the updated member
   * @throws {Error} If the API request fails
   */
  async updateMember(
    familyId: string,
    memberId: string,
    data: Partial<IFamilyMemberFormData>
  ): Promise<IFamilyMember> {
    return this.patch(`/api/families/${familyId}/members/${memberId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Removes a member from a family
   * @param {string} familyId - The unique ID for the family
   * @param {string} memberId - The unique ID for the member
   * @returns {Promise<any>} Promise resolving to the deletion response
   * @throws {Error} If the API request fails
   */
  async removeMember(familyId: string, memberId: string): Promise<any> {
    return this.delete(`/api/families/${familyId}/members/${memberId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

