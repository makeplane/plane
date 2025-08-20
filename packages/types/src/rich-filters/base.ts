import { TFilterValue } from "./config";
import { TAllOperators, TLogicalOperator } from "./operator";

/**
 * Filter node can be a condition or an operator. This will allow us to build a tree of filters.
 * - A condition is a single filter that can be used to filter a single field.
 * - An operator is a logical operator that can be used to combine multiple conditions.
 */
export const FILTER_NODE_TYPE = {
  CONDITION: "condition",
  GROUP: "group",
} as const;
export type TFilterNodeType = (typeof FILTER_NODE_TYPE)[keyof typeof FILTER_NODE_TYPE];

/**
 * Filter type is the type of filter that can be applied to a field.
 */
export const FILTER_TYPE = {
  TEXT: "text",
  NUMBER: "number",
  BOOLEAN: "boolean",
  SELECT: "select",
  MULTI_SELECT: "multi_select",
  DATE: "date",
} as const;
export type TFilterType = (typeof FILTER_TYPE)[keyof typeof FILTER_TYPE];

/**
 * Base filter node.
 * @property id - The id of the filter node.
 * @property type - The type of the filter node.
 */
export type TFilterNodeBase = {
  id: string;
  type: TFilterNodeType;
};

export type TFilterNode = TFilterNodeBase;

/**
 * Filter condition node.
 * @property property - The property of the filter condition.
 * @property operator - The operator of the filter condition.
 * @property value - The value of the filter condition.
 */
export type TFilterConditionNode<FilterPropertyKey extends string> = TFilterNode & {
  type: typeof FILTER_NODE_TYPE.CONDITION;
  property: FilterPropertyKey;
  operator: TAllOperators;
  value: TFilterValue;
};

/**
 * Filter group node.
 * @property logicalOperator - The logical operator of the filter group.
 * @property children - The children of the filter group.
 */
export type TFilterGroupNode<FilterPropertyKey extends string> = TFilterNode & {
  type: typeof FILTER_NODE_TYPE.GROUP;
  logicalOperator: TLogicalOperator;
  children: TFilterExpression<FilterPropertyKey>[];
};

/**
 * Filter expression. It can be a condition or a group.
 * @template FilterPropertyKey - The type of the filter property key.
 */
export type TFilterExpression<FilterPropertyKey extends string> =
  | TFilterConditionNode<FilterPropertyKey>
  | TFilterGroupNode<FilterPropertyKey>;

/**
 * Filter condition payload. Used to create / update a condition node.
 * @template FilterPropertyKey - The type of the filter property key.
 */
export type TFilterConditionPayload<FilterPropertyKey extends string> = Omit<
  TFilterConditionNode<FilterPropertyKey>,
  keyof TFilterNodeBase
>;

/**
 * Filter group payload. Used to create / update a group node.
 * @template FilterPropertyKey - The type of the filter property key.
 */
export type TFilterGroupPayload<FilterPropertyKey extends string> = Omit<
  TFilterGroupNode<FilterPropertyKey>,
  keyof TFilterNodeBase
>;
