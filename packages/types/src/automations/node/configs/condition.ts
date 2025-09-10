import { LOGICAL_OPERATOR, TAllOperators, TFilterValue } from "../../../rich-filters";
import { SingleOrArray } from "../../../utils";

export type TAutomationConditionFilterProperty =
  | "payload.data.assignee_ids"
  | "payload.data.created_by_id"
  | "payload.data.label_ids"
  | "payload.data.priority"
  | "payload.data.state_id"
  | "payload.data.type_id";

export type TAutomationConditionFilterData = {
  field: TAutomationConditionFilterProperty;
  operator: TAllOperators;
  value: SingleOrArray<TFilterValue>;
};

export type TAutomationConditionFilterAndGroup = {
  [LOGICAL_OPERATOR.AND]: TAutomationConditionFilterExpressionData[];
};

export type TAutomationConditionFilterOrGroup = {
  [LOGICAL_OPERATOR.OR]: TAutomationConditionFilterExpressionData[];
};

export type TAutomationConditionFilterNotGroup = {
  [LOGICAL_OPERATOR.NOT]: TAutomationConditionFilterExpressionData;
};

export type TAutomationConditionFilterGroup =
  | TAutomationConditionFilterAndGroup
  | TAutomationConditionFilterOrGroup
  | TAutomationConditionFilterNotGroup;

export type TAutomationConditionFilterExpressionData = TAutomationConditionFilterData | TAutomationConditionFilterGroup;

export type TAutomationConditionFilterExpression = TAutomationConditionFilterExpressionData | undefined;

export type TAutomationConditionNodeConfig = {
  filter_expression: TAutomationConditionFilterExpression;
};
