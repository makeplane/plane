export interface IView {
  id: string;
  access: string;
  created_at: Date;
  updated_at: Date;
  is_favorite: boolean;
  created_by: string;
  updated_by: string;
  name: string;
  description: string;
  query: IQuery;
  query_data: IQuery;
  project: string;
  workspace: string;
}

export interface IQuery {
  assignees: string[] | null;
  created_by: string[] | null;
  labels: string[] | null;
  priority: string[] | null;
  state: string[] | null;
  target_date: string[] | null;
  type: "active" | "backlog" | null;
}
