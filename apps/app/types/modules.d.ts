import type { IUser, IIssue, IProject } from ".";

export interface IModule {
  created_at: Date;
  created_by: string;
  description: string;
  description_text: any;
  description_html: any;
  id: string;
  lead: string | null;
  lead_detail: IUserLite;
  members_list: string[];
  name: string;
  project: string;
  project_detail: IProject;
  start_date: Date | null;
  status: "backlog" | "planned" | "in-progress" | "paused" | "completed" | "cancelled";
  target_date: Date | null;
  updated_at: Date;
  updated_by: string;
  workspace: string;
}

export type SelectModuleType =
  | (IModule & { actionType: "edit" | "delete" | "create-issue" })
  | undefined;

export type SelectIssue = (IIssue & { actionType: "edit" | "delete" | "create" }) | undefined;
