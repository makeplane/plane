export interface IEstimate {
  created_at: Date;
  created_by: string;
  description: string;
  id: string;
  name: string;
  project: string;
  project_detail: IProject;
  updated_at: Date;
  updated_by: string;
  points: IEstimatePoint[];
  workspace: string;
  workspace_detail: IWorkspace;
}

export interface IEstimatePoint {
  created_at: string;
  created_by: string;
  description: string;
  estimate: string;
  id: string;
  key: number;
  project: string;
  updated_at: string;
  updated_by: string;
  value: string;
  workspace: string;
}

export interface IEstimateFormData {
  estimate: {
    name: string;
    description: string;
  };
  estimate_points: {
    id?: string;
    key: number;
    value: string;
  }[];
}
