import type { IUser, IIssue } from "./";

export interface ICycle {
  id: string;
  owned_by: IUser;
  created_at: Date;
  updated_at: Date;
  name: string;
  description: string;
  start_date: Date | null;
  end_date: Date | null;
  status: string;
  created_by: string;
  updated_by: string;
  project: string;
  workspace: string;
  issue: string;
}

export interface SprintIssueResponse {
  id: string;
  issue_details: IIssue;
  created_at: Date;
  updated_at: Date;
  created_by: string;
  updated_by: string;
  project: string;
  workspace: string;
  issue: string;
  cycle: string;
}

export type SprintViewProps = {
  sprint: ICycle;
  selectSprint: React.Dispatch<React.SetStateAction<SelectSprintType>>;
  projectId: string;
  workspaceSlug: string;
  openIssueModal: (
    sprintId: string,
    issue?: IIssue,
    actionType?: "create" | "edit" | "delete"
  ) => void;
  addIssueToSprint: (sprintId: string, issueId: string) => void;
};

export type SelectSprintType =
  | (ICycle & { actionType: "edit" | "delete" | "create-issue" })
  | undefined;

export type SelectIssue = (IIssue & { actionType: "edit" | "delete" | "create" }) | undefined;
