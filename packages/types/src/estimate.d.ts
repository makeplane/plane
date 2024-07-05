import { EEstimateSystem, EEstimateUpdateStages } from "./enums";

export interface IEstimatePoint {
  id: string | undefined;
  key: number | undefined;
  value: string | undefined;
  description: string | undefined;
  workspace: string | undefined;
  project: string | undefined;
  estimate: string | undefined;
  created_at: Date | undefined;
  updated_at: Date | undefined;
  created_by: string | undefined;
  updated_by: string | undefined;
}

export type TEstimateSystemKeys =
  | EEstimateSystem.POINTS
  | EEstimateSystem.CATEGORIES
  | EEstimateSystem.TIME;

export interface IEstimate {
  id: string | undefined;
  name: string | undefined;
  description: string | undefined;
  type: TEstimateSystemKeys | undefined; // categories, points, time
  points: IEstimatePoint[] | undefined;
  workspace: string | undefined;
  project: string | undefined;
  last_used: boolean | undefined;
  created_at: Date | undefined;
  updated_at: Date | undefined;
  created_by: string | undefined;
  updated_by: string | undefined;
}

export interface IEstimateFormData {
  estimate?: {
    name?: string;
    type?: string;
    last_used?: boolean;
  };
  estimate_points: {
    id?: string | undefined;
    key: number;
    value: string;
  }[];
}

export type TEstimatePointsObject = {
  id?: string | undefined;
  key: number;
  value: string;
};

export type TTemplateValues = {
  title: string;
  values: TEstimatePointsObject[];
  hide?: boolean;
};

export type TEstimateSystem = {
  name: string;
  templates: Record<string, TTemplateValues>;
  is_available: boolean;
  is_ee: boolean;
};

export type TEstimateSystems = {
  [K in TEstimateSystemKeys]: TEstimateSystem;
};

// update estimates
export type TEstimateUpdateStageKeys =
  | EEstimateUpdateStages.CREATE
  | EEstimateUpdateStages.EDIT
  | EEstimateUpdateStages.SWITCH;

export type TEstimateTypeErrorObject = {
  oldValue: string;
  newValue: string;
  message: string | undefined;
};

export type TEstimateTypeError =
  | Record<number, TEstimateTypeErrorObject>
  | undefined;
