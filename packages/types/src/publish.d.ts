import { IProject, IProjectLite, IWorkspaceLite } from "@plane/types";

export type TPublishEntityType = "project";

export type TProjectPublishLayouts =
  | "calendar"
  | "gantt"
  | "kanban"
  | "list"
  | "spreadsheet";

export type TPublishViewProps = {
  calendar?: boolean;
  gantt?: boolean;
  kanban?: boolean;
  list?: boolean;
  spreadsheet?: boolean;
};

export type TProjectDetails = IProjectLite &
  Pick<IProject, "cover_image" | "logo_props" | "description">;

export type TPublishSettings = {
  anchor: string | undefined;
  is_comments_enabled: boolean;
  created_at: string | undefined;
  created_by: string | undefined;
  entity_identifier: string | undefined;
  entity_name: TPublishEntityType | undefined;
  id: string | undefined;
  inbox: unknown;
  project: string | undefined;
  project_details: TProjectDetails | undefined;
  is_reactions_enabled: boolean;
  updated_at: string | undefined;
  updated_by: string | undefined;
  view_props: TViewProps | undefined;
  is_votes_enabled: boolean;
  workspace: string | undefined;
  workspace_detail: IWorkspaceLite | undefined;
};
