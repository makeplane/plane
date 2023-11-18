// types
import { IIssue, IIssueLabel, IWorkspaceLite, IProjectLite } from "types";

export interface IPage {
  access: number;
  blocks: IPageBlock[];
  color: string;
  created_at: Date;
  created_by: string;
  description: string;
  description_html: string;
  description_stripped: string | null;
  id: string;
  is_favorite: boolean;
  label_details: IIssueLabel[];
  labels: string[];
  name: string;
  owned_by: string;
  project: string;
  project_detail: IProjectLite;
  updated_at: Date;
  updated_by: string;
  workspace: string;
  workspace_detail: IWorkspaceLite;
}

export interface RecentPagesResponse {
  [key: string]: IPage[];
}

export interface IPageBlock {
  completed_at: Date | null;
  created_at: Date;
  created_by: string;
  description: any;
  description_html: any;
  description_stripped: any;
  id: string;
  issue: string | null;
  issue_detail: IIssue | null;
  name: string;
  page: string;
  project: string;
  project_detail: IProjectLite;
  sort_order: number;
  sync: boolean;
  updated_at: Date;
  updated_by: string;
  workspace: string;
  workspace_detail: IWorkspaceLite;
}

export type TPageViewProps = "list" | "detailed" | "masonry";
