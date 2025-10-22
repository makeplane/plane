import { TIssuePriorities } from "./issues";

export type TDuplicateIssuePayload = {
  title: string;
  workspace_id: string;
  issue_id?: string;
  project_id?: string;
  description_stripped?: string;
};

export type TDeDupeIssue = {
  id: string;
  type_id: string | null;
  project_id: string;
  sequence_id: number;
  name: string;
  priority: TIssuePriorities;
  state_id: string;
  created_by: string;
};

export type TDuplicateIssueResponse = {
  dupes: TDeDupeIssue[];
};
