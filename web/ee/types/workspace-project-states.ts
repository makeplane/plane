export enum EProjectStateLoader {
  INIT_LOADER = "project-state-init-loader",
  MUTATION_LOADER = "project-state-mutation-loader",
}
export type TProjectStateLoader = EProjectStateLoader | undefined;

export type TProjectStateDraggableData = {
  groupKey: TProjectStateGroupKey;
  id: string;
};

export enum EProjectStateGroup {
  DRAFT = "draft",
  PLANNING = "planning",
  EXECUTION = "execution",
  MONITORING = "monitoring",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}
export type TProjectStateGroupKey = EProjectStateGroup;

export enum EProjectPriority {
  NONE = "none",
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  URGENT = "urgent",
}

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
