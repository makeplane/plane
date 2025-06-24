// types
import { API_BASE_URL } from "@plane/constants";
import {
  IIssuePropertiesService,
  TCreateIssuePropertyPayload,
  TIssuePropertyResponse,
  TUpdateIssuePropertyPayload,
  TFetchIssueTypesPayload,
  TDeleteIssuePropertyPayload,
} from "@plane/types";
// services
import { APIService } from "../api.service";

export class CustomerPropertyService extends APIService implements IIssuePropertiesService {
  constructor() {
    super(API_BASE_URL);
  }

  /**
   * Fetch all custom properties
   * @param workspaceSlug
   * @returns
   */
  async fetchAll({ workspaceSlug }: TFetchIssueTypesPayload): Promise<TIssuePropertyResponse[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/customer-properties/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Create custom property
   * @param workspaceSlug
   * @param data
   * @returns
   */
  async create({ workspaceSlug, data }: TCreateIssuePropertyPayload): Promise<TIssuePropertyResponse> {
    return this.post(`/api/workspaces/${workspaceSlug}/customer-properties/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
  /**
   * Update custom property
   * @param workspaceSlug
   * @param propertyId
   * @param data
   * @returns
   */
  async update({
    workspaceSlug,
    data,
    customPropertyId,
  }: TUpdateIssuePropertyPayload): Promise<TIssuePropertyResponse> {
    return this.patch(`/api/workspaces/${workspaceSlug}/customer-properties/${customPropertyId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Delete a custom property
   * @param workspaceSlug
   * @param propertyId
   * @returns Promise<void>
   */
  async deleteProperty({ workspaceSlug, customPropertyId }: TDeleteIssuePropertyPayload): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/customer-properties/${customPropertyId}/`)
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
