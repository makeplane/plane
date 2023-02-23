export interface IState {
  readonly id: string;
  color: string;
  readonly created_at: Date;
  readonly created_by: string;
  default: boolean;
  description: string;
  group: "backlog" | "unstarted" | "started" | "completed" | "cancelled";
  name: string;
  project: string;
  sequence: number;
  readonly slug: string;
  readonly updated_at: Date;
  readonly updated_by: string;
  workspace: string;
}

export interface StateResponse {
  [key: string]: IState[];
}
