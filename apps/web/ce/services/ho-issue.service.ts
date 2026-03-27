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
  start_date: string | null;
  target_date: string | null;
  completed_at: string | null;
  cycle_name: string | null;
  module_names: string[];
  total_log_time: number;
  reference_link_count: number;
};

export type THoIssueListResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: THoIssue[];
};

export type THoCategorySummary = {
  department_name: string;
  workspace_slug: string;
  project_id: string;
  project_name: string;
  main_task_category_name: string | null;
  sub_task_category_name: string | null;
  work_item_count: number;
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
}
