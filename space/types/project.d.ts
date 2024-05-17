import { TProjectLogoProps } from "@plane/types";

export type TWorkspaceDetails = {
  name: string;
  slug: string;
  id: string;
};

export type TViewDetails = {
  list: boolean;
  gantt: boolean;
  kanban: boolean;
  calendar: boolean;
  spreadsheet: boolean;
};

export type TProjectDetails = {
  id: string;
  identifier: string;
  name: string;
  cover_image: string | undefined;
  logo_props: TProjectLogoProps;
  description: string;
};

export type TProjectSettings = {
  id: string;
  anchor: string;
  comments: boolean;
  reactions: boolean;
  votes: boolean;
  inbox: unknown;
  workspace: string;
  workspace_detail: TWorkspaceDetails;
  project: string;
  project_details: TProjectDetails;
  views: TViewDetails;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
};
