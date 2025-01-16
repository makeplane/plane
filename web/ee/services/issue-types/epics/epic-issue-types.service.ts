// helpers
import { API_BASE_URL } from "@/helpers/common.helper";
// plane web types
import {
  IIssueTypesService,
  TFetchIssueTypesPayload,
  TIssueType,
  TEnableIssueTypePayload,
  TDisableIssueTypePayload,
} from "@/plane-web/types";
// services
import { APIService } from "@/services/api.service";

class EpicIssueTypesService extends APIService implements IIssueTypesService {
  constructor() {
    super(API_BASE_URL);
  }

  async fetchAll({ workspaceSlug }: TFetchIssueTypesPayload): Promise<TIssueType[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/epic-types/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async enable({ workspaceSlug, projectId }: TEnableIssueTypePayload): Promise<TIssueType> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/epic-status/`, {
      is_epic_enabled: true,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async disable({ workspaceSlug, projectId }: TDisableIssueTypePayload): Promise<void> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/epic-status/`, {
      is_epic_enabled: false,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

export const epicIssueTypeService = new EpicIssueTypesService();
