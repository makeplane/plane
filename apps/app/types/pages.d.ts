// types
import { IIssueLabels } from "./issues";

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
  label_details: IIssueLabels[];
  labels: string[];
  labels_list: string[];
  name: string;
  owned_by: string;
  project: string;
  updated_at: Date;
  updated_by: string;
  workspace: string;
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
  id: string;
  issue: string | null;
  issue_detail: string | null;
  name: string;
  page: string;
  project: string;
  sort_order: number;
  updated_at: Date;
  updated_by: string;
  workspace: string;
}

export type TPageViewProps = "list" | "detailed" | "masonry";
