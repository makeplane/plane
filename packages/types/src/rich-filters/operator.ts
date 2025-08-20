import { FILTER_TYPE, TFilterType } from "./base";

/**
 * Logical operator to combine multiple conditions.
 * - AND: All conditions must be true
 * - OR: At least one condition must be true
 * - NOT: Negates the conditions within the group
 */
export const LOGICAL_OPERATOR = {
  AND: "and",
  OR: "or",
  NOT: "not",
} as const;
export type TLogicalOperator = (typeof LOGICAL_OPERATOR)[keyof typeof LOGICAL_OPERATOR];

export const EQUALITY_OPERATORS = {
  IS: "is",
  IS_NOT: "is_not",
} as const;
export type TEqualityOperator = (typeof EQUALITY_OPERATORS)[keyof typeof EQUALITY_OPERATORS];

export const COLLECTION_OPERATORS = {
  IN: "in",
  NOT_IN: "not_in",
} as const;
export type TCollectionOperator = (typeof COLLECTION_OPERATORS)[keyof typeof COLLECTION_OPERATORS];

export const COMPARISON_OPERATORS = {
  BETWEEN: "between",
  NOT_BETWEEN: "not_between",
} as const;
export type TComparisonOperator = (typeof COMPARISON_OPERATORS)[keyof typeof COMPARISON_OPERATORS];

export const POSITIVE_OPERATORS = [
  EQUALITY_OPERATORS.IS,
  COLLECTION_OPERATORS.IN,
  COMPARISON_OPERATORS.BETWEEN,
] as const;
export type TPositiveOperator = (typeof POSITIVE_OPERATORS)[keyof typeof POSITIVE_OPERATORS];

/**
 * Operators that can be negated
 */
export const NEGATION_OPERATORS = [
  EQUALITY_OPERATORS.IS_NOT,
  COLLECTION_OPERATORS.NOT_IN,
  COMPARISON_OPERATORS.NOT_BETWEEN,
] as const;
export type TNegationOperator = (typeof NEGATION_OPERATORS)[keyof typeof NEGATION_OPERATORS];

/**
 * Map of positive operators to their negation operators
 */
export const POSITIVE_TO_NEGATION_OPERATOR_MAP = {
  [EQUALITY_OPERATORS.IS]: EQUALITY_OPERATORS.IS_NOT,
  [COLLECTION_OPERATORS.IN]: COLLECTION_OPERATORS.NOT_IN,
  [COMPARISON_OPERATORS.BETWEEN]: COMPARISON_OPERATORS.NOT_BETWEEN,
} as const;

/**
 * Map of negation operators to their positive operators
 */
export const NEGATION_TO_POSITIVE_OPERATOR_MAP = {
  [EQUALITY_OPERATORS.IS_NOT]: EQUALITY_OPERATORS.IS,
  [COLLECTION_OPERATORS.NOT_IN]: COLLECTION_OPERATORS.IN,
  [COMPARISON_OPERATORS.NOT_BETWEEN]: COMPARISON_OPERATORS.BETWEEN,
} as const;

export const ONE_TO_MANY_OPERATOR_MAP = {
  [EQUALITY_OPERATORS.IS]: COLLECTION_OPERATORS.IN,
  [EQUALITY_OPERATORS.IS_NOT]: COLLECTION_OPERATORS.NOT_IN,
} as const;

export const MANY_TO_ONE_OPERATOR_MAP = {
  [COLLECTION_OPERATORS.IN]: EQUALITY_OPERATORS.IS,
  [COLLECTION_OPERATORS.NOT_IN]: EQUALITY_OPERATORS.IS_NOT,
} as const;

export const TEXT_OPERATORS = [EQUALITY_OPERATORS.IS, EQUALITY_OPERATORS.IS_NOT] as const;
export type TTextOperators = (typeof TEXT_OPERATORS)[keyof typeof TEXT_OPERATORS];

export const NUMBER_OPERATORS = [
  EQUALITY_OPERATORS.IS,
  EQUALITY_OPERATORS.IS_NOT,
  COMPARISON_OPERATORS.BETWEEN,
  COMPARISON_OPERATORS.NOT_BETWEEN,
] as const;
export type TNumberOperators = (typeof NUMBER_OPERATORS)[keyof typeof NUMBER_OPERATORS];

export const BOOLEAN_OPERATORS = [EQUALITY_OPERATORS.IS, EQUALITY_OPERATORS.IS_NOT] as const;
export type TBooleanOperators = (typeof BOOLEAN_OPERATORS)[keyof typeof BOOLEAN_OPERATORS];

export const SELECT_OPERATORS = [EQUALITY_OPERATORS.IS, EQUALITY_OPERATORS.IS_NOT] as const;
export type TSelectOperators = (typeof SELECT_OPERATORS)[keyof typeof SELECT_OPERATORS];

export const MULTI_SELECT_OPERATORS = [
  EQUALITY_OPERATORS.IS,
  EQUALITY_OPERATORS.IS_NOT,
  COLLECTION_OPERATORS.IN,
  COLLECTION_OPERATORS.NOT_IN,
] as const;
export type TMultiSelectOperators = (typeof MULTI_SELECT_OPERATORS)[keyof typeof MULTI_SELECT_OPERATORS];

export const DATE_OPERATORS = [
  EQUALITY_OPERATORS.IS,
  EQUALITY_OPERATORS.IS_NOT,
  COMPARISON_OPERATORS.BETWEEN,
  COMPARISON_OPERATORS.NOT_BETWEEN,
] as const;
export type TDateOperators = (typeof DATE_OPERATORS)[keyof typeof DATE_OPERATORS];

/**
 * All supported operators union type - automatically derived from all arrays
 */
export type TAllOperators = TEqualityOperator | TCollectionOperator | TComparisonOperator;

/**
 * Operator map by filter type - automatically uses the runtime arrays
 */
export const FILTER_TYPE_OPERATORS_MAP = {
  [FILTER_TYPE.TEXT]: TEXT_OPERATORS,
  [FILTER_TYPE.NUMBER]: NUMBER_OPERATORS,
  [FILTER_TYPE.BOOLEAN]: BOOLEAN_OPERATORS,
  [FILTER_TYPE.SELECT]: SELECT_OPERATORS,
  [FILTER_TYPE.MULTI_SELECT]: MULTI_SELECT_OPERATORS,
  [FILTER_TYPE.DATE]: DATE_OPERATORS,
} as const;

/**
 * Type-safe operator map by filter type
 */
export type TOperatorMap = {
  [FILTER_TYPE.TEXT]: TTextOperators;
  [FILTER_TYPE.NUMBER]: TNumberOperators;
  [FILTER_TYPE.BOOLEAN]: TBooleanOperators;
  [FILTER_TYPE.SELECT]: TSelectOperators;
  [FILTER_TYPE.MULTI_SELECT]: TMultiSelectOperators;
  [FILTER_TYPE.DATE]: TDateOperators;
};

/**
 * Valid operator for filter type.
 * @template T - The type of the filter type.
 */
export type TValidOperatorForFilterType<T extends TFilterType> = TOperatorMap[T];
