// plane imports
import {
  IIssuePropertyOptionsService,
  TCreateIssuePropertyOptionPayload,
  TDeleteIssuePropertyOptionPayload,
  TFetchIssuePropertyOptionsPayload,
  TIssuePropertyOption,
  TIssuePropertyOptionsPayload,
} from "@plane/types";
// helpers
import { API_BASE_URL } from "@/helpers/common.helper";
// services
import { APIService } from "@/services/api.service";

class IssuePropertyOptionsService extends APIService implements IIssuePropertyOptionsService {
  constructor() {
    super(API_BASE_URL);
  }

  async fetchAll({
    workspaceSlug,
    projectId,
  }: TFetchIssuePropertyOptionsPayload): Promise<TIssuePropertyOptionsPayload> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issue-property-options/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async create({
    workspaceSlug,
    projectId,
    customPropertyId,
    data,
  }: TCreateIssuePropertyOptionPayload): Promise<TIssuePropertyOption> {
    return this.post(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/issue-properties/${customPropertyId}/options/`,
      data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteOption({
    workspaceSlug,
    projectId,
    customPropertyId,
    issuePropertyOptionId,
  }: TDeleteIssuePropertyOptionPayload): Promise<void> {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/issue-properties/${customPropertyId}/options/${issuePropertyOptionId}/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

export const issuePropertyOptionService = new IssuePropertyOptionsService();
