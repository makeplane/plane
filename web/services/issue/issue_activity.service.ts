import { APIService } from "services/api.service";
// types
import { TIssueActivity } from "@plane/types";
// helper
import { API_BASE_URL } from "helpers/common.helper";

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
      | {} = {}
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
