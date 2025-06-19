import { EProjectPriority, EProjectStateGroup, EProjectStateLoader } from "@plane/constants";
import { EUpdateStatus } from "../enums";

export type TProjectPriority = EProjectPriority;

export type TProjectStateLoader = EProjectStateLoader | undefined;

export type TProjectStateDraggableData = {
  groupKey: TProjectStateGroupKey;
  id: string;
};

export type TProjectStateGroupKey = EProjectStateGroup;

export type TProjectState = {
  id: string | undefined;
  name: string | undefined;
  description: string | undefined;
  color: string | undefined;
  sequence: number | undefined;
  group: TProjectStateGroupKey | undefined;
  default: boolean | undefined;
  external_source: string | undefined;
  external_id: string | undefined;
  workspace_id: string | undefined;
  created_by: string | undefined;
  updated_by: string | undefined;
  created_at: string | undefined;
  updated_at: string | undefined;
};

export type TProjectStateIdsByGroup = {
  [key in TProjectStateGroupKey]: string[];
};

export type TProjectStatesByGroup = {
  [key in TProjectStateGroupKey]: TProjectState[];
};

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

export type TProjectExtended =
  TProjectAttributes & {
    description_html?: string | undefined;
    project_name?: string;
    update_status?: EUpdateStatus | undefined;
    initiative_ids?: string[];
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
