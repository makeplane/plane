import type { IUser, IUserLite, IIssue, IProject } from ".";

export interface IModule {
  created_at: Date;
  created_by: string;
  description: string;
  description_text: any;
  description_html: any;
  id: string;
  lead: string | null;
  lead_detail: IUserLite | null;
  link_module: {
    created_at: Date;
    created_by: string;
    created_by_detail: IUserLite;
    id: string;
    metadata: any;
    title: string;
    url: string;
  }[];
  links_list: ModuleLink[];
  members: string[];
  members_list: string[];
  members_detail: IUserLite[];
  name: string;
  project: string;
  project_detail: IProject;
  start_date: string | null;
  status: "backlog" | "planned" | "in-progress" | "paused" | "completed" | "cancelled" | null;
  target_date: string | null;
  updated_at: Date;
  updated_by: string;
  workspace: string;
}

export interface ModuleIssueResponse {
  created_at: Date;
  created_by: string;
  id: string;
  issue: string;
  issue_detail: IIssue;
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

export type SelectModuleType =
  | (IModule & { actionType: "edit" | "delete" | "create-issue" })
  | undefined;

export type SelectIssue = (IIssue & { actionType: "edit" | "delete" | "create" }) | undefined;
