import { API_BASE_URL } from "@plane/constants";
import { APIService } from "@/services/api.service";

export type THoIssueAssignee = {
  id: string;
  display_name: string;
  avatar: string;
};

export type THoIssue = {
  id: string;
  project_id: string;
  workspace_slug: string;
  department_name: string;
  project_name: string;
  name: string;
  main_task_category_name: string | null;
  sub_task_category_name: string | null;
  sub_issues_count: number;
  project_lead: string | null;
  assignees: THoIssueAssignee[];
  is_bank_wide_project: boolean;
  priority: string;
  state_name: string | null;
  state_color: string | null;
  state_group: string | null;
  start_date: string | null;
  target_date: string | null;
  completed_at: string | null;
  cycle_name: string | null;
  module_names: string[];
  reference_link_count: number;
};

export type THoIssueListResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: THoIssue[];
};

export type THoCategorySummary = {
  department_id: string;
  department_name: string;
  main_task_category_name: string | null;
  main_task_category_description: string | null;
  sub_task_category_name: string | null;
  sub_task_category_description: string | null;
};

export type THoWorkspaceProject = {
  id: string;
  name: string;
  identifier: string;
};

export type THoAccessibleWorkspace = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  department_id: string;
  department_name: string;
  projects: THoWorkspaceProject[];
};

export type THoWorklogMember = {
  user_id: string;
  display_name: string;
  avatar_url: string;
  total_minutes: number;
};

export type THoWorklogBreakdown = {
  total_minutes: number;
  count: number;
  next: string | null;
  previous: string | null;
  members: THoWorklogMember[];
};

export type THoWorklogByUserEntry = {
  issue_id: string;
  issue_name: string;
  project_name: string;
  total_minutes: number;
};

export type THoWorklogByUserResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: THoWorklogByUserEntry[];
};

export type THoExportJobStatus = "queued" | "processing" | "ready" | "failed" | "expired";

export type THoExportJob = {
  id: string;
  status: THoExportJobStatus;
  filters: Record<string, string>;
  file_url: string | null;
  file_size: number;
  row_count: number;
  error_message: string;
  expires_at: string | null;
  completed_at: string | null;
  created_at: string;
};

export type THoFilterOptions = {
  states: string[];
  main_task_categories: string[];
  sub_task_categories: string[];
  cycles: string[];
  modules: string[];
  assignees: { id: string; display_name: string }[];
  leads: { id: string; display_name: string }[];
  workspaces: { id: string; name: string }[];
  projects: { id: string; name: string }[];
  priorities: string[];
  progress: string[];
};

export class HoIssueService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async listIssues(params: Record<string, string>): Promise<THoIssueListResponse> {
    const query = new URLSearchParams(params).toString();
    return this.get(`/api/ho/issues/${query ? `?${query}` : ""}`)
      .then((res: { data: THoIssueListResponse }) => res.data)
      .catch((err: { response?: { data: unknown } }) => {
        throw err?.response?.data;
      });
  }

  async getCategorySummary(params: Record<string, string>): Promise<THoCategorySummary[]> {
    const query = new URLSearchParams(params).toString();
    return this.get(`/api/ho/category-summary/${query ? `?${query}` : ""}`)
      .then((res: { data: THoCategorySummary[] }) => res.data)
      .catch((err: { response?: { data: unknown } }) => {
        throw err?.response?.data;
      });
  }

  async listAccessibleWorkspaces(): Promise<THoAccessibleWorkspace[]> {
    return this.get("/api/ho/workspaces/")
      .then((res: { data: THoAccessibleWorkspace[] }) => res.data)
      .catch((err: { response?: { data: unknown } }) => {
        throw err?.response?.data;
      });
  }

  async listIssueWorklogBreakdown(issueId: string, page = 1): Promise<THoWorklogBreakdown> {
    return this.get(`/api/ho/issues/${issueId}/worklogs/?page=${page}`)
      .then((res: { data: THoWorklogBreakdown }) => res.data)
      .catch((err: { response?: { data: unknown } }) => {
        throw err?.response?.data;
      });
  }

  async listIssueWorklogByUser(issueId: string, userId: string, page = 1): Promise<THoWorklogByUserResponse> {
    return this.get(`/api/ho/issues/${issueId}/worklogs/by-user/${userId}/?page=${page}`)
      .then((res: { data: THoWorklogByUserResponse }) => res.data)
      .catch((err: { response?: { data: unknown } }) => {
        throw err?.response?.data;
      });
  }

  async listFilterOptions(params: Record<string, string>): Promise<THoFilterOptions> {
    const query = new URLSearchParams(params).toString();
    return this.get(`/api/ho/filter-options/${query ? `?${query}` : ""}`)
      .then((res: { data: THoFilterOptions }) => res.data)
      .catch((err: { response?: { data: unknown } }) => {
        throw err?.response?.data;
      });
  }

  async listMyExports(): Promise<THoExportJob[]> {
    return this.get("/api/ho/exports/")
      .then((res: { data: THoExportJob[] }) => res.data)
      .catch((err: { response?: { data: unknown } }) => {
        throw err?.response?.data;
      });
  }

  async exportDatasheet(filters: Record<string, string>): Promise<{ job_id: string; message: string }> {
    return this.post("/api/ho/exports/", filters)
      .then((res: { data: { job_id: string; message: string } }) => res.data)
      .catch((err: { response?: { data: unknown } }) => {
        throw err?.response?.data;
      });
  }
}
