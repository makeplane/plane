// types
import { TIssue, IIssueLabel, IWorkspaceLite, IProjectLite } from "@plane/types";

export interface IPage {
  access: number;
  archived_at: string | null;
  blocks: IPageBlock[];
  color: string;
  created_at: Date;
  created_by: string;
  description: string;
  description_html: string;
  description_stripped: string | null;
  id: string;
  is_favorite: boolean;
  is_locked: boolean;
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

export interface IRecentPages {
  today: string[];
  yesterday: string[];
  this_week: string[];
  older: string[];
  [key: string]: string[];
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
  issue_detail: TIssue | null;
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
