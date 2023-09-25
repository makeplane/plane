import { IIssueFilterOptions } from "./view-props";

export interface IWorkspaceView {
  access: string;
  created_at: Date;
  created_by: string;
  description: string;
  id: string;
  name: string;
  query: IIssueFilterOptions;
  query_data: IIssueFilterOptions;
  updated_at: Date;
  updated_by: string;
  is_favorite: boolean;
  workspace: string;
  workspace_detail: {
    id: string;
    name: string;
    slug: string;
  };
}
