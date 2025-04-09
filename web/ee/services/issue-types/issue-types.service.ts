// plane imports
import {
  IIssueTypesService,
  TFetchIssueTypesPayload,
  TCreateIssueTypePayload,
  TIssueType,
  TUpdateIssueTypePayload,
  TDeleteIssueTypePayload,
  TEnableIssueTypePayload,
  TFetchIssueTypesProjectLevelPayload,
} from "@plane/types";
import { API_BASE_URL } from "@/helpers/common.helper";
// services
import { APIService } from "@/services/api.service";

class IssueTypesService extends APIService implements IIssueTypesService {
  constructor() {
    super(API_BASE_URL);
  }

  async fetchAll({ workspaceSlug }: TFetchIssueTypesPayload): Promise<TIssueType[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/issue-types/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async fetchAllProjectLevel({ workspaceSlug, projectId }: TFetchIssueTypesProjectLevelPayload): Promise<TIssueType[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issue-types/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async create({ workspaceSlug, projectId, data }: TCreateIssueTypePayload): Promise<TIssueType> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issue-types/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async update({ workspaceSlug, projectId, issueTypeId, data }: TUpdateIssueTypePayload): Promise<TIssueType> {
    return this.patch(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issue-types/${issueTypeId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteType({ workspaceSlug, projectId, issueTypeId }: TDeleteIssueTypePayload): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issue-types/${issueTypeId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async enable({ workspaceSlug, projectId }: TEnableIssueTypePayload): Promise<TIssueType> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/default-issue-types/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

export const issueTypeService = new IssueTypesService();
