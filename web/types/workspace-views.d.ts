import { IWorkspaceViewProps } from "./view-props";

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
  query: any;
  query_data: IWorkspaceViewProps;
  project: string;
  workspace: string;
  workspace_detail?: {
    id: string;
    name: string;
    slug: string;
  };
}

export type TStaticViewTypes = "all-issues" | "assigned" | "created" | "subscribed";
