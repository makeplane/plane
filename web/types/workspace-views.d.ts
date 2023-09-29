import { IWorkspaceGlobalViewProps } from "./view-props";

export interface IWorkspaceView {
  id: string;
  access: string;
  created_at: Date;
  updated_at: Date;
  is_favorite: boolean;
  created_by: string;
  updated_by: string;
  name: string;
  description: string;
  query: IWorkspaceGlobalViewProps;
  query_data: IWorkspaceGlobalViewProps;
  project: string;
  workspace: string;
  workspace_detail?: {
    id: string;
    name: string;
    slug: string;
  };
}
