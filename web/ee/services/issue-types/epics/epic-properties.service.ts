// helpers
import { API_BASE_URL } from "@/helpers/common.helper";
// plane web types
import {
  EIssuePropertyType,
  IIssuePropertiesService,
  TCreateIssuePropertyPayload,
  TDeleteIssuePropertyPayload,
  TFetchIssuePropertiesPayload,
  TIssueProperty,
  TIssuePropertyResponse,
  TUpdateIssuePropertyPayload,
} from "@/plane-web/types";
// services
import { APIService } from "@/services/api.service";

export class EpicPropertiesService extends APIService implements IIssuePropertiesService {
  constructor() {
    super(API_BASE_URL);
  }

  async fetchAll({
    workspaceSlug,
    projectId,
  }: TFetchIssuePropertiesPayload): Promise<TIssueProperty<EIssuePropertyType>[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/epic-properties/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async create({ workspaceSlug, projectId, data }: TCreateIssuePropertyPayload): Promise<TIssuePropertyResponse> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/epic-properties/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async update({
    workspaceSlug,
    projectId,
    issuePropertyId,
    data,
  }: TUpdateIssuePropertyPayload): Promise<TIssuePropertyResponse> {
    return this.patch(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/epic-properties/${issuePropertyId}/`,
      data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteProperty({ workspaceSlug, projectId, issuePropertyId }: TDeleteIssuePropertyPayload): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/epic-properties/${issuePropertyId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

export const epicPropertyService = new EpicPropertiesService();
