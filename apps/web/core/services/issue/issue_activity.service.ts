import { API_BASE_URL } from "@plane/constants";
import { EIssueServiceType, TIssueActivity, TIssueServiceType } from "@plane/types";
import { APIService } from "@/services/api.service";
// types
// helper

export class IssueActivityService extends APIService {
  private serviceType: TIssueServiceType;

  constructor(serviceType: TIssueServiceType = EIssueServiceType.ISSUES) {
    super(API_BASE_URL);
    this.serviceType = serviceType;
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
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/${this.serviceType}/${issueId}/history/`, {
      params: {
        activity_type: `${this.serviceType === EIssueServiceType.EPICS ? "epic-property" : "issue-property"}`,
        ...params,
      },
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
