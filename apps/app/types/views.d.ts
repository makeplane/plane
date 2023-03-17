export interface IView {
  id: string;
  access: string;
  created_at: Date;
  updated_at: Date;
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
  state: string[] | null;
  parent: string[] | null;
  labels: string[] | null;
  assignees: string[] | null;
  created_by: string[] | null;
  name: string | null;
  created_at: [
    {
      datetime: string;
      timeline: "before";
    },
    {
      datetime: string;
      timeline: "after";
    }
  ];
  updated_at: string[] | null;
  start_date: string[] | null;
  target_date: string[] | null;
  completed_at: string[] | null;
  type: string;
}
