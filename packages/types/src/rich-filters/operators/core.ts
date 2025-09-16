/**
 * Core logical operators
 */
export const CORE_LOGICAL_OPERATOR = {
  AND: "and",
} as const;

/**
 * Core equality operators
 */
export const CORE_EQUALITY_OPERATOR = {
  EXACT: "exact",
} as const;

/**
 * Core collection operators
 */
export const CORE_COLLECTION_OPERATOR = {
  IN: "in",
} as const;

/**
 * Core comparison operators
 */
export const CORE_COMPARISON_OPERATOR = {
  RANGE: "range",
} as const;

// -------- TYPE EXPORTS --------

type TCoreEqualityOperator = (typeof CORE_EQUALITY_OPERATOR)[keyof typeof CORE_EQUALITY_OPERATOR];
type TCoreCollectionOperator = (typeof CORE_COLLECTION_OPERATOR)[keyof typeof CORE_COLLECTION_OPERATOR];
type TCoreComparisonOperator = (typeof CORE_COMPARISON_OPERATOR)[keyof typeof CORE_COMPARISON_OPERATOR];

/**
 * All core operators that can be used in filter conditions
 */
export type TCoreSupportedOperators = TCoreEqualityOperator | TCoreCollectionOperator | TCoreComparisonOperator;
