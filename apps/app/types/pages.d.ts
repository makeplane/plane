export interface LabelDetail {
  id: string;
  created_at: Date;
  updated_at: Date;
  name: string;
  description: string;
  color: string;
  created_by: string;
  updated_by: string;
  project: string;
  workspace: string;
  parent: string | null;
}

export interface IPage {
  access: number;
  color: string;
  created_at: Date;
  created_by: string;
  description: string;
  description_html: string;
  description_stripped: string | null;
  id: string;
  is_favorite: boolean;
  label_details: LabelDetail[];
  labels: string[];
  name: string;
  owned_by: string;
  project: string;
  updated_at: Date;
  updated_by: string;
  workspace: string;
}

export interface IPageForm {
  name: string;
  description?: string;
  labels_list?: string[];
}

export interface RecentPagesResponse {
  earlier_this_week: IPage[];
  yesterday: IPage[];
}

export interface IPageBlock {
  completed_at: Date | null;
  created_at: Date;
  created_by: string;
  description: string;
  description_html: string;
  description_stripped: string | null;
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

export interface IPageBlockForm {
  name: string;
  description?: string;
}

export interface IPageFavorite {
  id: string;
  page_detail: IPage;
  created_at: Date;
  updated_at: Date;
  created_by: string;
  updated_by: string;
  project: string;
  workspace: string;
  user: string;
  page: string;
}
