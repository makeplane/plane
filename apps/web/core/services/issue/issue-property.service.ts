import { API_BASE_URL } from "@plane/constants";
import type { TIssueCustomFieldsResponse, TIssueProperty, TIssuePropertyPayload } from "@plane/types";
import { APIService } from "@/services/api.service";

export class IssuePropertyService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async listProperties(workspaceSlug: string, projectId: string, isActive = true): Promise<TIssueProperty[]> {
    try {
      const response = await this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/properties/`, {
        params: { is_active: isActive ? "true" : "false" },
      });
      return response.data as TIssueProperty[];
    } catch (error: unknown) {
      throw (error as { response?: { data: unknown } }).response?.data;
    }
  }

  async createProperty(workspaceSlug: string, projectId: string, data: TIssuePropertyPayload): Promise<TIssueProperty> {
    try {
      const response = await this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/properties/`, data);
      return response.data as TIssueProperty;
    } catch (error: unknown) {
      throw (error as { response?: { data: unknown } }).response?.data;
    }
  }

  async updateProperty(
    workspaceSlug: string,
    projectId: string,
    propertyId: string,
    data: TIssuePropertyPayload
  ): Promise<TIssueProperty> {
    try {
      const response = await this.patch(
        `/api/workspaces/${workspaceSlug}/projects/${projectId}/properties/${propertyId}/`,
        data
      );
      return response.data as TIssueProperty;
    } catch (error: unknown) {
      throw (error as { response?: { data: unknown } }).response?.data;
    }
  }

  async deleteProperty(workspaceSlug: string, projectId: string, propertyId: string): Promise<void> {
    try {
      await this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/properties/${propertyId}/`);
    } catch (error: unknown) {
      throw (error as { response?: { data: unknown } }).response?.data;
    }
  }

  async getIssueCustomFields(
    workspaceSlug: string,
    projectId: string,
    issueId: string
  ): Promise<TIssueCustomFieldsResponse> {
    try {
      const response = await this.get(
        `/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/custom-fields/`
      );
      return response.data as TIssueCustomFieldsResponse;
    } catch (error: unknown) {
      throw (error as { response?: { data: unknown } }).response?.data;
    }
  }

  async setIssueCustomFields(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    customFields: Record<string, unknown>
  ): Promise<TIssueCustomFieldsResponse> {
    try {
      const response = await this.post(
        `/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/custom-fields/`,
        { custom_fields: customFields }
      );
      return response.data as TIssueCustomFieldsResponse;
    } catch (error: unknown) {
      throw (error as { response?: { data: unknown } }).response?.data;
    }
  }
}
