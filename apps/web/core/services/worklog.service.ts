import { API_BASE_URL } from "@plane/constants";
import type {
  IWorkLog,
  IWorkLogCreate,
  IWorkLogUpdate,
  IWorkLogSummary,
  ITimesheetGridResponse,
  ITimesheetBulkPayload,
  ICapacityReportResponse,
} from "@plane/types";
import { APIService } from "@/services/api.service";

export class WorklogService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  // Issue-level CRUD
  async listWorklogs(workspaceSlug: string, projectId: string, issueId: string): Promise<IWorkLog[]> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/worklogs/`) as Promise<any>);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
      return response?.data ?? [];
    } catch (error: any) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      throw error?.response?.data;
    }
  }

  async createWorklog(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    data: IWorkLogCreate
  ): Promise<IWorkLog> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/worklogs/`, data) as Promise<any>);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
      return response?.data;
    } catch (error: any) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      throw error?.response?.data;
    }
  }

  async updateWorklog(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    worklogId: string,
    data: IWorkLogUpdate
  ): Promise<IWorkLog> {
    try {
       
      const response = await (this.patch(
        `/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/worklogs/${worklogId}/`,
        data
      ) as Promise<any>);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
      return response?.data;
    } catch (error: any) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      throw error?.response?.data;
    }
  }

  async deleteWorklog(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    worklogId: string
  ): Promise<void> {
    try {
      await this.delete(
        `/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/worklogs/${worklogId}/`
      );
    } catch (error: any) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      throw error?.response?.data;
    }
  }

  // Summary endpoints
  async getProjectSummary(
    workspaceSlug: string,
    projectId: string,
    params?: Record<string, string>
  ): Promise<IWorkLogSummary> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/worklogs/summary/`, { params }) as Promise<any>);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
      return response?.data;
    } catch (error: any) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      throw error?.response?.data;
    }
  }

  async getWorkspaceSummary(
    workspaceSlug: string,
    params?: Record<string, string>
  ): Promise<IWorkLogSummary> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (this.get(`/api/workspaces/${workspaceSlug}/time-tracking/summary/`, { params }) as Promise<any>);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
      return response?.data;
    } catch (error: any) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      throw error?.response?.data;
    }
  }

  // Timesheet grid endpoints
  async getTimesheetGrid(
    workspaceSlug: string,
    projectId: string,
    params?: Record<string, string>
  ): Promise<ITimesheetGridResponse> {
    try {
       
      const response = await (this.get(
        `/api/workspaces/${workspaceSlug}/projects/${projectId}/time-tracking/timesheet/`,
        { params }
      ) as Promise<any>);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
      return response?.data;
    } catch (error: any) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      throw error?.response?.data;
    }
  }

  async bulkUpdateTimesheet(
    workspaceSlug: string,
    projectId: string,
    data: ITimesheetBulkPayload
  ): Promise<{ results: Array<{ issue_id: string; logged_at: string; action: string }> }> {
    try {
       
      const response = await (this.post(
        `/api/workspaces/${workspaceSlug}/projects/${projectId}/time-tracking/timesheet/bulk/`,
        data
      ) as Promise<any>);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
      return response?.data;
    } catch (error: any) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      throw error?.response?.data;
    }
  }

  // Capacity report endpoint
  async getCapacityReport(
    workspaceSlug: string,
    projectId: string,
    params?: Record<string, string>
  ): Promise<ICapacityReportResponse> {
    try {
       
      const response = await (this.get(
        `/api/workspaces/${workspaceSlug}/projects/${projectId}/time-tracking/capacity/`,
        { params }
      ) as Promise<any>);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
      return response?.data;
    } catch (error: any) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      throw error?.response?.data;
    }
  }
}
