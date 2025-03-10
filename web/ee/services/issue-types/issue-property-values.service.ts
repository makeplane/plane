import { EIssueServiceType } from "@plane/constants";
import { TIssueServiceType, TIssuePropertyValues } from "@plane/types";
// helpers
import { API_BASE_URL } from "@/helpers/common.helper";
// plane imports
// services
import { APIService } from "@/services/api.service";

export class IssuePropertyValuesService extends APIService {
  private serviceType: TIssueServiceType;

  constructor(serviceType: TIssueServiceType = EIssueServiceType.ISSUES) {
    super(API_BASE_URL);
    this.serviceType = serviceType;
  }

  async fetchAll(workspaceSlug: string, projectId: string, issueId: string): Promise<TIssuePropertyValues> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/${this.serviceType}/${issueId}/values/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async create(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    data: TIssuePropertyValues
  ): Promise<TIssuePropertyValues> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/${this.serviceType}/${issueId}/values/`, {
      property_values: data,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async update(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    propertyId: string,
    data: string[]
  ): Promise<void> {
    return this.patch(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/${this.serviceType}/${issueId}/${this.serviceType === EIssueServiceType.EPICS ? "epic-properties" : "issue-properties"}/${propertyId}/values/`,
      {
        values: data,
      }
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
