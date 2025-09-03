export enum ERecurringWorkItemRunLogStatus {
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
}

export type TRecurringWorkItemRunLog = {
  created_at: string;
  created_by: string | null;
  deleted_at: string | null;
  error_message: string | null;
  finished_at: string;
  id: string;
  project: string;
  recurring_task: string;
  started_at: string;
  status: ERecurringWorkItemRunLogStatus;
  task_id: string;
  updated_at: string;
  updated_by: string | null;
  workitem: string;
  workitem_sequence_id: number;
  workspace: string;
};
