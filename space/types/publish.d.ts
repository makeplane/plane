import { TProjectDetails, TViewDetails, TWorkspaceDetails } from "./project";

export type TPublishSettings = {
  anchor: string | undefined;
  comments: boolean;
  created_at: string | undefined;
  created_by: string | undefined;
  id: string | undefined;
  inbox: unknown;
  project: string | undefined;
  project_details: TProjectDetails | undefined;
  reactions: boolean;
  updated_at: string | undefined;
  updated_by: string | undefined;
  views: TViewDetails | undefined;
  votes: boolean;
  workspace: string | undefined;
  workspace_detail: TWorkspaceDetails | undefined;
};
