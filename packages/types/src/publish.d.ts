import { IProject, IProjectLite, IWorkspaceLite } from "@plane/types";

export type TPublishEntityType = "project" | "page";

export type TProjectPublishLayouts =
  | "calendar"
  | "gantt"
  | "kanban"
  | "list"
  | "spreadsheet";

export type TProjectPublishViewProps = {
  calendar?: boolean;
  gantt?: boolean;
  kanban?: boolean;
  list?: boolean;
  spreadsheet?: boolean;
};

export type TProjectDetails = IProjectLite &
  Pick<IProject, "cover_image" | "logo_props" | "description">;

type TPublishSettings = {
  anchor: string | undefined;
  created_at: string | undefined;
  created_by: string | undefined;
  entity_identifier: string | undefined;
  entity_name: TPublishEntityType | undefined;
  id: string | undefined;
  inbox: unknown;
  is_comments_enabled: boolean;
  is_reactions_enabled: boolean;
  is_votes_enabled: boolean;
  project: string | undefined;
  project_details: TProjectDetails | undefined;
  updated_at: string | undefined;
  updated_by: string | undefined;
  workspace: string | undefined;
  workspace_detail: IWorkspaceLite | undefined;
};

export type TProjectPublishSettings = TPublishSettings & {
  view_props: TProjectPublishViewProps | undefined;
};
