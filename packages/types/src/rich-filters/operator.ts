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

/**
 * Type representing logical operators for combining filter conditions.
 */
export type TLogicalOperator = (typeof LOGICAL_OPERATOR)[keyof typeof LOGICAL_OPERATOR];

/**
 * Equality operators for exact matching.
 * - IS: Equals/matches the specified value
 * - IS_NOT: Does not equal/match the specified value
 */
export const EQUALITY_OPERATORS = {
  IS: "is",
  IS_NOT: "is_not",
} as const;

/**
 * Type representing equality operators.
 */
export type TEqualityOperator = (typeof EQUALITY_OPERATORS)[keyof typeof EQUALITY_OPERATORS];

/**
 * Collection operators for array/set operations.
 * - IN: Value is contained within the specified collection
 * - NOT_IN: Value is not contained within the specified collection
 */
export const COLLECTION_OPERATORS = {
  IN: "in",
  NOT_IN: "not_in",
} as const;

/**
 * Type representing collection operators.
 */
export type TCollectionOperator = (typeof COLLECTION_OPERATORS)[keyof typeof COLLECTION_OPERATORS];

/**
 * Comparison operators for range operations.
 * - BETWEEN: Value falls within the specified range (inclusive)
 * - NOT_BETWEEN: Value falls outside the specified range
 */
export const COMPARISON_OPERATORS = {
  BETWEEN: "between",
  NOT_BETWEEN: "not_between",
} as const;

/**
 * Type representing comparison operators.
 */
export type TComparisonOperator = (typeof COMPARISON_OPERATORS)[keyof typeof COMPARISON_OPERATORS];

/**
 * Array of positive operators that can be negated.
 * These represent the "positive" form of conditions.
 */
export const POSITIVE_OPERATORS = [
  EQUALITY_OPERATORS.IS,
  COLLECTION_OPERATORS.IN,
  COMPARISON_OPERATORS.BETWEEN,
] as const;

/**
 * Type representing positive operators.
 */
export type TPositiveOperator = (typeof POSITIVE_OPERATORS)[keyof typeof POSITIVE_OPERATORS];

/**
 * Array of operators that represent negated conditions.
 * These are the "negative" counterparts to positive operators.
 */
export const NEGATION_OPERATORS = [
  EQUALITY_OPERATORS.IS_NOT,
  COLLECTION_OPERATORS.NOT_IN,
  COMPARISON_OPERATORS.NOT_BETWEEN,
] as const;

/**
 * Type representing negation operators.
 */
export type TNegationOperator = (typeof NEGATION_OPERATORS)[keyof typeof NEGATION_OPERATORS];

/**
 * Map of positive operators to their corresponding negation operators.
 * Used for toggling between positive and negative forms of conditions.
 */
export const POSITIVE_TO_NEGATION_OPERATOR_MAP = {
  [EQUALITY_OPERATORS.IS]: EQUALITY_OPERATORS.IS_NOT,
  [COLLECTION_OPERATORS.IN]: COLLECTION_OPERATORS.NOT_IN,
  [COMPARISON_OPERATORS.BETWEEN]: COMPARISON_OPERATORS.NOT_BETWEEN,
} as const;

/**
 * Map of negation operators to their corresponding positive operators.
 * Used for toggling between negative and positive forms of conditions.
 */
export const NEGATION_TO_POSITIVE_OPERATOR_MAP = {
  [EQUALITY_OPERATORS.IS_NOT]: EQUALITY_OPERATORS.IS,
  [COLLECTION_OPERATORS.NOT_IN]: COLLECTION_OPERATORS.IN,
  [COMPARISON_OPERATORS.NOT_BETWEEN]: COMPARISON_OPERATORS.BETWEEN,
} as const;

/**
 * Map for converting single-value operators to their multi-value equivalents.
 * Used when transforming conditions to handle multiple values.
 */
export const ONE_TO_MANY_OPERATOR_MAP = {
  [EQUALITY_OPERATORS.IS]: COLLECTION_OPERATORS.IN,
  [EQUALITY_OPERATORS.IS_NOT]: COLLECTION_OPERATORS.NOT_IN,
} as const;

/**
 * Map for converting multi-value operators to their single-value equivalents.
 * Used when transforming conditions to handle single values.
 */
export const MANY_TO_ONE_OPERATOR_MAP = {
  [COLLECTION_OPERATORS.IN]: EQUALITY_OPERATORS.IS,
  [COLLECTION_OPERATORS.NOT_IN]: EQUALITY_OPERATORS.IS_NOT,
} as const;

/**
 * Array of operators supported by text filters.
 * Text filters support basic equality operations.
 */
export const TEXT_OPERATORS = [EQUALITY_OPERATORS.IS, EQUALITY_OPERATORS.IS_NOT] as const;

/**
 * Type representing operators available for text filters.
 */
export type TTextOperators = (typeof TEXT_OPERATORS)[keyof typeof TEXT_OPERATORS];

/**
 * Array of operators supported by number filters.
 * Number filters support equality and range operations.
 */
export const NUMBER_OPERATORS = [
  EQUALITY_OPERATORS.IS,
  EQUALITY_OPERATORS.IS_NOT,
  COMPARISON_OPERATORS.BETWEEN,
  COMPARISON_OPERATORS.NOT_BETWEEN,
] as const;

/**
 * Type representing operators available for number filters.
 */
export type TNumberOperators = (typeof NUMBER_OPERATORS)[keyof typeof NUMBER_OPERATORS];

/**
 * Array of operators supported by boolean filters.
 * Boolean filters support basic equality operations.
 */
export const BOOLEAN_OPERATORS = [EQUALITY_OPERATORS.IS, EQUALITY_OPERATORS.IS_NOT] as const;

/**
 * Type representing operators available for boolean filters.
 */
export type TBooleanOperators = (typeof BOOLEAN_OPERATORS)[keyof typeof BOOLEAN_OPERATORS];

/**
 * Array of operators supported by select filters.
 * Select filters support basic equality operations for single selections.
 */
export const SELECT_OPERATORS = [EQUALITY_OPERATORS.IS, EQUALITY_OPERATORS.IS_NOT] as const;

/**
 * Type representing operators available for select filters.
 */
export type TSelectOperators = (typeof SELECT_OPERATORS)[keyof typeof SELECT_OPERATORS];

/**
 * Array of operators supported by multi-select filters.
 * Multi-select filters support both equality and collection operations.
 */
export const MULTI_SELECT_OPERATORS = [
  EQUALITY_OPERATORS.IS,
  EQUALITY_OPERATORS.IS_NOT,
  COLLECTION_OPERATORS.IN,
  COLLECTION_OPERATORS.NOT_IN,
] as const;

/**
 * Type representing operators available for multi-select filters.
 */
export type TMultiSelectOperators = (typeof MULTI_SELECT_OPERATORS)[keyof typeof MULTI_SELECT_OPERATORS];

/**
 * Array of operators supported by date filters.
 * Date filters support equality and range operations.
 */
export const DATE_OPERATORS = [
  EQUALITY_OPERATORS.IS,
  EQUALITY_OPERATORS.IS_NOT,
  COMPARISON_OPERATORS.BETWEEN,
  COMPARISON_OPERATORS.NOT_BETWEEN,
] as const;

/**
 * Type representing operators available for date filters.
 */
export type TDateOperators = (typeof DATE_OPERATORS)[keyof typeof DATE_OPERATORS];

/**
 * Union type of all supported operators across all filter types.
 * Automatically derived from the individual operator type unions.
 */
export type TAllOperators = TEqualityOperator | TCollectionOperator | TComparisonOperator;

/**
 * Map of filter types to their supported operators.
 * Used to determine which operators are available for each filter type at runtime.
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
 * Type-safe mapping of filter types to their corresponding operator types.
 * Provides compile-time type safety when working with filter type operators.
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
 * Utility type that returns the valid operators for a given filter type.
 * Provides type-safe operator selection based on filter type.
 * @template T - The filter type to get valid operators for.
 */
export type TValidOperatorForFilterType<T extends TFilterType> = TOperatorMap[T];
