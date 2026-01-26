// plane imports
import { API_BASE_URL } from "@plane/constants";
import type { TTimeEntry, TTimeEntryEditableFields, TTimeEntrySummary, TIssueServiceType } from "@plane/types";
import { EIssueServiceType } from "@plane/types";
// services
import { APIService } from "@/services/api.service";

export class TimeEntryService extends APIService {
  private serviceType: TIssueServiceType;

  constructor(serviceType: TIssueServiceType = EIssueServiceType.ISSUES) {
    super(API_BASE_URL);
    this.serviceType = serviceType;
  }

  async fetchTimeEntries(workspaceSlug: string, projectId: string, issueId: string): Promise<TTimeEntry[]> {
    return this.get(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/time-entries/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createTimeEntry(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    data: TTimeEntryEditableFields
  ): Promise<TTimeEntry> {
    return this.post(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/time-entries/`,
      data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateTimeEntry(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    timeEntryId: string,
    data: Partial<TTimeEntryEditableFields>
  ): Promise<TTimeEntry> {
    return this.patch(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/time-entries/${timeEntryId}/`,
      data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteTimeEntry(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    timeEntryId: string
  ): Promise<void> {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/time-entries/${timeEntryId}/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getTimeEntrySummary(workspaceSlug: string, projectId: string, issueId: string): Promise<TTimeEntrySummary> {
    return this.get(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/time-entries/summary/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
