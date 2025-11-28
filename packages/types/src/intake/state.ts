export type TIntakeStateGroups = "triage";

export interface IIntakeState {
  readonly id: string;
  color: string;
  default: boolean;
  description: string;
  group: TIntakeStateGroups;
  name: string;
  project_id: string;
  sequence: number;
  workspace_id: string;
}
