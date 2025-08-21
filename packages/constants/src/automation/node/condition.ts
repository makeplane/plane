import { LOGICAL_OPERATOR, TAutomationConditionFilterExpression, TAutomationConditionNodeConfig } from "@plane/types";

export const DEFAULT_AUTOMATION_CONDITION_FILTER_EXPRESSION: TAutomationConditionFilterExpression = {
  [LOGICAL_OPERATOR.AND]: [],
};

export const DEFAULT_AUTOMATION_CONDITION_CONFIG: TAutomationConditionNodeConfig = {
  filter_expression: DEFAULT_AUTOMATION_CONDITION_FILTER_EXPRESSION,
};
