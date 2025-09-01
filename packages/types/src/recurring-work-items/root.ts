import { TWorkItemBlueprint, TWorkItemBlueprintFormData } from "../templates/blueprint/work-item";

export enum ERecurringWorkItemIntervalType {
  DAILY = "daily",
  WEEKLY = "weekly",
  MONTHLY = "monthly",
  YEARLY = "yearly",
}

export type TRecurringWorkItem = {
  id: string;
  workitem_blueprint: TWorkItemBlueprint;
  enabled: boolean;
  // frequency
  start_at: Date;
  end_at: Date | null;
  interval_type: ERecurringWorkItemIntervalType;
  // workspace
  workspace: string;
  // project
  project: string;
  // timestamp
  created_at: string;
  updated_at: string;
};

export type TRecurringWorkItemForm = Pick<
  TRecurringWorkItem,
  "id" | "enabled" | "start_at" | "end_at" | "interval_type"
> & {
  workitem_blueprint: TWorkItemBlueprintFormData;
};
