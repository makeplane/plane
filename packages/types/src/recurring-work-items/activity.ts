import { TProjectBaseActivity } from "../activity";
import { TRecurringWorkItemRunLog } from "./run-log";

export type TRecurringWorkItemActivityFields =
  | "assignees"
  | "description"
  | "labels"
  | "modules"
  | "name"
  | "priority"
  | "recurring_workitem"
  | "state"
  | "type"
  | "custom_property"
  | "start_at"
  | "end_at"
  | "interval_type"
  | "task_execution";

export type TRecurringWorkItemActivityVerbs = "created" | "added" | "updated" | "removed" | "completed" | "failed";

export type TRecurringWorkItemActivityKeys = `${TRecurringWorkItemActivityFields}_${TRecurringWorkItemActivityVerbs}`;

export type TRecurringWorkItemActivity = TProjectBaseActivity<
  TRecurringWorkItemActivityFields,
  TRecurringWorkItemActivityVerbs
> & {
  property: string | null;
  recurring_workitem_task_log: TRecurringWorkItemRunLog | null;
};
