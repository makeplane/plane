export type TAddCommentActionConfig = {
  comment_text: string;
};

export enum EAutomationChangePropertyType {
  STATE = "state_id",
  PRIORITY = "priority",
  ASSIGNEE = "assignee_ids",
  LABELS = "label_ids",
  START_DATE = "start_date",
  DUE_DATE = "target_date",
}

export enum EAutomationChangeType {
  ADD = "add",
  REMOVE = "remove",
  UPDATE = "update",
}

export type TChangePropertyActionConfig = {
  change_type: EAutomationChangeType;
  property_name: EAutomationChangePropertyType;
  property_value: string[];
};

export type TChangePropertyActionFormConfig = {
  change_type?: EAutomationChangeType;
  property_name?: EAutomationChangePropertyType;
  property_value: string[];
};

export type TAutomationActionNodeConfig = TAddCommentActionConfig | TChangePropertyActionConfig;
