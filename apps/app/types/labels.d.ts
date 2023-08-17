export interface IIssueLabels {
  id: string;
  created_at?: Date;
  updated_at?: Date;
  name: string;
  description: string;
  color: string;
  created_by?: string;
  updated_by?: string;
  project?: string;
  project_detail?: IProjectLite;
  workspace?: string;
  workspace_detail?: IWorkspaceLite;
  parent: string | null;
}

export interface LabelForm {
  name: string;
  description: string;
  color: string;
  parent: string | null;
}
