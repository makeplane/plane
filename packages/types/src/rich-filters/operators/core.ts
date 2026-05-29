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

/**
 * Core operators that support multiple values
 */
export const CORE_MULTI_VALUE_OPERATORS = [CORE_COLLECTION_OPERATOR.IN, CORE_COMPARISON_OPERATOR.RANGE] as const;

/**
 * All core operators
 */
export const CORE_OPERATORS = {
  ...CORE_EQUALITY_OPERATOR,
  ...CORE_COLLECTION_OPERATOR,
  ...CORE_COMPARISON_OPERATOR,
} as const;

/**
 * All core operators that can be used in filter conditions
 */
export type TCoreSupportedOperators = (typeof CORE_OPERATORS)[keyof typeof CORE_OPERATORS];
