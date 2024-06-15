import { TIssueActivity } from "@plane/types";
import { API_BASE_URL } from "@/helpers/common.helper";
import { APIService } from "@/services/api.service";
// types
// helper

export class IssueActivityService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getIssueActivities(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    params:
      | {
          created_at__gt: string;
        }
      | object = {}
  ): Promise<TIssueActivity[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/history/`, {
      params: {
        activity_type: "issue-property",
        ...params,
      },
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
