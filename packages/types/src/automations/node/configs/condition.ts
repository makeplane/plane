import { LOGICAL_OPERATOR, TAllOperators, TFilterValues } from "../../../rich-filters";

export type TAutomationConditionFilterKeys =
  | "payload.data.assignee_ids"
  | "payload.data.created_by_id"
  | "payload.data.label_ids"
  | "payload.data.priority"
  | "payload.data.state_id"
  | "payload.data.type_id";

export type TAutomationConditionFilterConfig = {
  field: TAutomationConditionFilterKeys;
  operator: TAllOperators;
  value: TFilterValues;
};

export type TAutomationConditionFilterExpression =
  | { [LOGICAL_OPERATOR.AND]: (TAutomationConditionFilterConfig | TAutomationConditionFilterExpression)[] }
  | { [LOGICAL_OPERATOR.OR]: (TAutomationConditionFilterConfig | TAutomationConditionFilterExpression)[] }
  | { [LOGICAL_OPERATOR.NOT]: TAutomationConditionFilterConfig | TAutomationConditionFilterExpression };

export type TAutomationConditionNodeConfig = {
  filter_expression: TAutomationConditionFilterExpression;
};
