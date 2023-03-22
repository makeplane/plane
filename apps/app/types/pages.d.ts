export interface IPage {
  id: string;
  is_favorite: boolean;
  created_at: Date;
  updated_at: Date;
  name: string;
  description: string;
  description_html: string;
  description_stripped: string | null;
  access: number;
  created_by: string;
  updated_by: string;
  project: string;
  workspace: string;
  owned_by: string;
}

export interface IPageForm {
  name: string;
  description?: string;
}

export interface IPageBlock {
  id: string;
  issue_detail: string | null;
  created_at: Date;
  updated_at: Date;
  name: string;
  description: string;
  description_html: string;
  description_stripped: string | null;
  completed_at: Date | null;
  created_by: string;
  updated_by: string;
  project: string;
  workspace: string;
  page: string;
  issue: string | null;
}


export interface IPageBlockForm {
  name: string;
  description?: string;
}