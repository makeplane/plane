import { IProject, IProjectLite, IWorkspaceLite } from "@plane/types";

export type TStateGroups = "backlog" | "unstarted" | "started" | "completed" | "cancelled";

export interface IState {
  readonly id: string;
  color: string;
  default: boolean;
  description: string;
  group: TStateGroups;
  name: string;
  project_id: string;
  sequence: number;
  workspace_id: string;
}

export interface IStateLite {
  color: string;
  group: TStateGroups;
  id: string;
  name: string;
}

export interface IStateResponse {
  [key: string]: IState[];
}
