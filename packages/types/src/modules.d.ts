import type {
  IUser,
  IUserLite,
  TIssue,
  IProject,
  IWorkspace,
  IWorkspaceLite,
  IProjectLite,
  IIssueFilterOptions,
  ILinkDetails,
} from "@plane/types";

export type TModuleStatus = "backlog" | "planned" | "in-progress" | "paused" | "completed" | "cancelled";

export interface IModule {
  backlog_issues: number;
  cancelled_issues: number;
  completed_issues: number;
  created_at: Date;
  created_by: string;
  description: string;
  description_text: any;
  description_html: any;
  distribution: {
    assignees: TAssigneesDistribution[];
    completion_chart: TCompletionChartDistribution;
    labels: TLabelsDistribution[];
  };
  id: string;
  lead: string | null;
  lead_detail: IUserLite | null;
  link_module: ILinkDetails[];
  links_list: ModuleLink[];
  members: string[];
  members_detail: IUserLite[];
  is_favorite: boolean;
  name: string;
  project: string;
  project_detail: IProjectLite;
  sort_order: number;
  start_date: string | null;
  started_issues: number;
  status: TModuleStatus;
  target_date: string | null;
  total_issues: number;
  unstarted_issues: number;
  updated_at: Date;
  updated_by: string;
  view_props: {
    filters: IIssueFilterOptions;
  };
  workspace: string;
  workspace_detail: IWorkspaceLite;
}

export interface ModuleIssueResponse {
  created_at: Date;
  created_by: string;
  id: string;
  issue: string;
  issue_detail: TIssue;
  module: string;
  module_detail: IModule;
  project: string;
  updated_at: Date;
  updated_by: string;
  workspace: string;
  sub_issues_count: number;
}

export type ModuleLink = {
  title: string;
  url: string;
};

export type SelectModuleType = (IModule & { actionType: "edit" | "delete" | "create-issue" }) | undefined;

export type SelectIssue = (TIssue & { actionType: "edit" | "delete" | "create" }) | undefined;
