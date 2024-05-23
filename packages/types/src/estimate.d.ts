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

export type TEstimateType = "categories" | "points" | "time";

export interface IEstimate {
  id: string | undefined;
  name: string | undefined;
  description: string | undefined;
  type: TEstimateType | undefined; // categories, points, time
  points: IEstimatePoint[] | undefined;
  workspace: string | undefined;
  workspace_detail: IWorkspace | undefined;
  project: string | undefined;
  project_detail: IProject | undefined;
  created_at: Date | undefined;
  updated_at: Date | undefined;
  created_by: string | undefined;
  updated_by: string | undefined;
}

export interface IEstimateFormData {
  estimate: {
    name: string;
    description: string;
    type: string;
  };
  estimate_points: {
    id?: string;
    key: number;
    value: string;
  }[];
}
