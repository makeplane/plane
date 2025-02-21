import { IProject, IPartialProject } from "@plane/types";
// plane web types
import { TProjectPriority } from "@/plane-web/types/workspace-project-filters";

export type TPartialProject = IPartialProject;

export type TProjectAttributes = {
  state_id?: string | undefined;
  priority?: TProjectPriority | undefined;
  start_date?: string | undefined | null;
  target_date?: string | undefined | null;
};

export type TProjectAttributesParams = {
  project_ids?: string;
};

export type TProjectAttributesResponse = TProjectAttributes & {
  project_id: string;
};

export type TProject = TPartialProject &
  IProject &
  TProjectAttributes & {
  description_html?: string | undefined;
  };

export type TProjectFeatures = {
  id?: string | undefined;
  is_project_updates_enabled: boolean;
  is_epic_enabled: boolean;
  is_issue_type_enabled: boolean;
  is_time_tracking_enabled: boolean;
  project_id: string;
};
