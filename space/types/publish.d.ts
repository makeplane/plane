import { IWorkspaceLite } from "@plane/types";
import { TProjectDetails, TViewDetails } from "@/types/project";

export type TPublishEntityType = "project";

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
  view_props: TViewDetails | undefined;
  is_votes_enabled: boolean;
  workspace: string | undefined;
  workspace_detail: IWorkspaceLite | undefined;
};
