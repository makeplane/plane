export interface IEstimate {
  id: string;
  created_at: Date;
  updated_at: Date;
  name: string;
  description: string;
  created_by: string;
  updated_by: string;
  points: IEstimatePoint[];
  project: string;
  project_detail: IProject;
  workspace: string;
  workspace_detail: IWorkspace;
}

export interface IEstimatePoint {
  id: string;
  created_at: string;
  created_by: string;
  description: string;
  estimate: string;
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
