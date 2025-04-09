import { IProject, IPartialProject } from "@plane/types";
// plane web types
import { EUpdateStatus } from "@plane/types/src/enums";
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
    project_name?: string;
    update_status?: EUpdateStatus | undefined;
  };

export type TProjectFeaturesList = {
  is_project_updates_enabled: boolean;
  is_epic_enabled: boolean;
  is_issue_type_enabled: boolean;
  is_time_tracking_enabled: boolean;
  is_workflow_enabled: boolean;
};

export type TProjectFeatures = {
  id?: string | undefined;
  project_id: string;
} & TProjectFeaturesList;
