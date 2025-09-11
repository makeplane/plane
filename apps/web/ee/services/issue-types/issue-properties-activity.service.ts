// plane imports
import { API_BASE_URL } from "@plane/constants";
import { TIssuePropertiesActivity } from "@plane/types";
// helpers
// services
import { APIService } from "@/services/api.service";

export class IssuePropertiesActivityService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async fetchAll(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    params:
      | {
          created_at__gt: string;
        }
      | object = {}
  ): Promise<TIssuePropertiesActivity[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/property-activity/`, {
      params,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
