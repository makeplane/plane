import { API_BASE_URL } from "@plane/constants";
import type { TIssueTimer, TActiveTimer, TIssueTimerAdmin } from "@plane/types";
import { APIService } from "@/services/api.service";

export class IssueTimerService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getTimer(workspaceSlug: string, projectId: string, issueId: string): Promise<TIssueTimer | null> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/timer/`)
      .then((response) => response?.data || null)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async actionTimer(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    action: "start" | "pause" | "resume" | "stop",
    note: string = "",
    is_manual: boolean = false
  ): Promise<TIssueTimer> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/timer/`, {
      action,
      note,
      is_manual,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getActiveTimers(workspaceSlug: string): Promise<TActiveTimer[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/timers/active/`)
      .then((response) => response?.data || [])
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getUserTimers(workspaceSlug: string): Promise<TIssueTimerAdmin[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/timers/me/`)
      .then((response) => response?.data || [])
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getAdminTimers(workspaceSlug: string): Promise<TIssueTimerAdmin[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/timers/admin/`)
      .then((response) => response?.data || [])
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}


