import { API_BASE_URL } from "@plane/constants";
import type {
  IAnalyticsTimesheetResponse,
  ICapacityCategoriesResponse,
  ICapacityDayDetailsResponse,
  ICapacityReportResponse,
  ITimesheetBulkPayload,
  ITimesheetGridResponse,
  IWorkLog,
  IWorkLogCreate,
  IWorkLogSummary,
  IWorkLogUpdate,
} from "@plane/types";
import { APIService } from "@/services/api.service";

// Helper to cast the axios response data to the expected type
function getData<T>(response: { data: T }): T {
  return response.data;
}

export class WorklogService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  // Issue-level CRUD
  async listWorklogs(workspaceSlug: string, projectId: string, issueId: string): Promise<IWorkLog[]> {
    return (
      this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/worklogs/`) as Promise<{
        data: IWorkLog[];
      }>
    )
      .then(getData)
      .catch((error: { response?: { data: unknown } }) => {
        throw error?.response?.data;
      });
  }

  async createWorklog(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    data: IWorkLogCreate
  ): Promise<IWorkLog> {
    return (
      this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/worklogs/`, data) as Promise<{
        data: IWorkLog;
      }>
    )
      .then(getData)
      .catch((error: { response?: { data: unknown } }) => {
        throw error?.response?.data;
      });
  }

  async updateWorklog(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    worklogId: string,
    data: IWorkLogUpdate
  ): Promise<IWorkLog> {
    return (
      this.patch(
        `/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/worklogs/${worklogId}/`,
        data
      ) as Promise<{ data: IWorkLog }>
    )
      .then(getData)
      .catch((error: { response?: { data: unknown } }) => {
        throw error?.response?.data;
      });
  }

  async deleteWorklog(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    worklogId: string,
    reason?: string
  ): Promise<void> {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/worklogs/${worklogId}/`,
      reason ? { reason } : undefined
    )
      .then(() => {
        return;
      })
      .catch((error: { response?: { data: unknown } }) => {
        throw error?.response?.data;
      });
  }

  // Summary endpoints
  async getProjectSummary(
    workspaceSlug: string,
    projectId: string,
    params?: Record<string, string>
  ): Promise<IWorkLogSummary> {
    return (
      this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/worklogs/summary/`, { params }) as Promise<{
        data: IWorkLogSummary;
      }>
    )
      .then(getData)
      .catch((error: { response?: { data: unknown } }) => {
        throw error?.response?.data;
      });
  }

  async getWorkspaceSummary(workspaceSlug: string, params?: Record<string, string>): Promise<IWorkLogSummary> {
    return (
      this.get(`/api/workspaces/${workspaceSlug}/time-tracking/summary/`, { params }) as Promise<{
        data: IWorkLogSummary;
      }>
    )
      .then(getData)
      .catch((error: { response?: { data: unknown } }) => {
        throw error?.response?.data;
      });
  }

  // Timesheet grid endpoints
  async getTimesheetGrid(
    workspaceSlug: string,
    projectId: string,
    params?: Record<string, string>
  ): Promise<ITimesheetGridResponse> {
    return (
      this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/time-tracking/timesheet/`, {
        params,
      }) as Promise<{ data: ITimesheetGridResponse }>
    )
      .then(getData)
      .catch((error: { response?: { data: unknown } }) => {
        throw error?.response?.data;
      });
  }

  async bulkUpdateTimesheet(
    workspaceSlug: string,
    projectId: string,
    data: ITimesheetBulkPayload
  ): Promise<{ results: Array<{ issue_id: string; logged_at: string; action: string }> }> {
    type BulkResult = { results: Array<{ issue_id: string; logged_at: string; action: string }> };
    return (
      this.post(
        `/api/workspaces/${workspaceSlug}/projects/${projectId}/time-tracking/timesheet/bulk/`,
        data
      ) as Promise<{ data: BulkResult }>
    )
      .then(getData)
      .catch((error: { response?: { data: unknown } }) => {
        throw error?.response?.data;
      });
  }

  // Capacity report endpoint
  async getCapacityReport(
    workspaceSlug: string,
    projectId: string,
    params?: Record<string, string>
  ): Promise<ICapacityReportResponse> {
    return (
      this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/time-tracking/capacity/`, {
        params,
      }) as Promise<{ data: ICapacityReportResponse }>
    )
      .then(getData)
      .catch((error: { response?: { data: unknown } }) => {
        throw error?.response?.data;
      });
  }

  // Analytics timesheet endpoint (all users' logs for a project)
  async getAnalyticsTimesheet(
    workspaceSlug: string,
    projectId: string,
    params?: Record<string, string>
  ): Promise<IAnalyticsTimesheetResponse> {
    return (
      this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/time-tracking/analytics/timesheet/`, {
        params,
      }) as Promise<{ data: IAnalyticsTimesheetResponse }>
    )
      .then(getData)
      .catch((error: { response?: { data: unknown } }) => {
        throw error?.response?.data;
      });
  }

  // Workspace analytics timesheet endpoint (all users' logs for a workspace)
  async getWorkspaceAnalyticsTimesheet(
    workspaceSlug: string,
    params?: Record<string, string>
  ): Promise<IAnalyticsTimesheetResponse> {
    return (
      this.get(`/api/workspaces/${workspaceSlug}/time-tracking/analytics/timesheet/`, {
        params,
      }) as Promise<{ data: IAnalyticsTimesheetResponse }>
    )
      .then(getData)
      .catch((error: { response?: { data: unknown } }) => {
        // eslint-disable-next-line @typescript-eslint/only-throw-error
        throw error?.response?.data ?? error;
      });
  }

  // Capacity categories (grouped by main_task_category / sub_task_category)
  async getCapacityCategories(
    workspaceSlug: string,
    projectId: string,
    params?: Record<string, string>
  ): Promise<ICapacityCategoriesResponse> {
    return (
      this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/time-tracking/capacity/categories/`, {
        params,
      }) as Promise<{ data: ICapacityCategoriesResponse }>
    )
      .then(getData)
      .catch((error: { response?: { data: unknown } }) => {
        throw error?.response?.data;
      });
  }

  // Capacity day details (tasks logged by a member on a specific date)
  async getCapacityDayDetails(
    workspaceSlug: string,
    projectId: string,
    memberId: string,
    date: string
  ): Promise<ICapacityDayDetailsResponse> {
    return (
      this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/time-tracking/capacity/day-details/`, {
        params: { member_id: memberId, date },
      }) as Promise<{ data: ICapacityDayDetailsResponse }>
    )
      .then(getData)
      .catch((error: { response?: { data: unknown } }) => {
        throw error?.response?.data;
      });
  }

  // Cross-workspace timesheet (current user's logs across all workspaces)
  async getCrossWorkspaceTimesheet(
    workspaceSlug: string,
    params?: Record<string, string>
  ): Promise<ITimesheetGridResponse> {
    return (
      this.get(`/api/workspaces/${workspaceSlug}/time-tracking/cross-workspace/timesheet/`, {
        params,
      }) as Promise<{ data: ITimesheetGridResponse }>
    )
      .then(getData)
      .catch((error: { response?: { data: unknown } }) => {
        throw error?.response?.data;
      });
  }

  // Cross-workspace capacity (all members across all user workspaces)
  async getCrossWorkspaceCapacity(
    workspaceSlug: string,
    params?: Record<string, string>
  ): Promise<ICapacityReportResponse> {
    return (
      this.get(`/api/workspaces/${workspaceSlug}/time-tracking/cross-workspace/capacity/`, {
        params,
      }) as Promise<{ data: ICapacityReportResponse }>
    )
      .then(getData)
      .catch((error: { response?: { data: unknown } }) => {
        throw error?.response?.data;
      });
  }

  async getCrossWorkspaceCapacityDayDetails(
    workspaceSlug: string,
    memberId: string,
    date: string
  ): Promise<ICapacityDayDetailsResponse> {
    return (
      this.get(`/api/workspaces/${workspaceSlug}/time-tracking/cross-workspace/capacity/day-details/`, {
        params: { member_id: memberId, date },
      }) as Promise<{ data: ICapacityDayDetailsResponse }>
    )
      .then(getData)
      .catch((error: { response?: { data: unknown } }) => {
        throw error?.response?.data;
      });
  }
}
