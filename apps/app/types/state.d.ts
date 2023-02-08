export interface IState {
  readonly id: string;
  readonly created_at: Date;
  readonly updated_at: Date;
  name: string;
  description: string;
  color: string;
  readonly slug: string;
  readonly created_by: string;
  readonly updated_by: string;
  project: string;
  workspace: string;
  sequence: number;
  group: "backlog" | "unstarted" | "started" | "completed" | "cancelled";
}

export interface StateResponse {
  [key: string]: IState[];
}
