import { TProjectBaseActivity } from "../activity";

export type TRecurringWorkItemActivityFields =
  | "assignees"
  | "description"
  | "end_at"
  | "interval_type"
  | "labels"
  | "modules"
  | "name"
  | "priority"
  | "recurring_workitem"
  | "start_at"
  | "state"
  | "type";

export type TRecurringWorkItemActivityVerbs = "created" | "added" | "updated" | "removed";

export type TRecurringWorkItemActivityKeys = `${TRecurringWorkItemActivityFields}_${TRecurringWorkItemActivityVerbs}`;

export type TRecurringWorkItemActivity = TProjectBaseActivity<
  TRecurringWorkItemActivityFields,
  TRecurringWorkItemActivityVerbs
>;
