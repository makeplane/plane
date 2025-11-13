import type { TCoreSupportedOperators } from "./core";
import {
  CORE_LOGICAL_OPERATOR,
  CORE_EQUALITY_OPERATOR,
  CORE_COLLECTION_OPERATOR,
  CORE_COMPARISON_OPERATOR,
  CORE_MULTI_VALUE_OPERATORS,
} from "./core";
import type { TExtendedSupportedOperators } from "./extended";
import {
  EXTENDED_LOGICAL_OPERATOR,
  EXTENDED_EQUALITY_OPERATOR,
  EXTENDED_COLLECTION_OPERATOR,
  EXTENDED_COMPARISON_OPERATOR,
  EXTENDED_MULTI_VALUE_OPERATORS,
} from "./extended";

// -------- COMPOSED OPERATORS --------

export const LOGICAL_OPERATOR = {
  ...CORE_LOGICAL_OPERATOR,
  ...EXTENDED_LOGICAL_OPERATOR,
} as const;

export const EQUALITY_OPERATOR = {
  ...CORE_EQUALITY_OPERATOR,
  ...EXTENDED_EQUALITY_OPERATOR,
} as const;

export const COLLECTION_OPERATOR = {
  ...CORE_COLLECTION_OPERATOR,
  ...EXTENDED_COLLECTION_OPERATOR,
} as const;

export const COMPARISON_OPERATOR = {
  ...CORE_COMPARISON_OPERATOR,
  ...EXTENDED_COMPARISON_OPERATOR,
} as const;

export const MULTI_VALUE_OPERATORS: ReadonlyArray<TSupportedOperators> = [
  ...CORE_MULTI_VALUE_OPERATORS,
  ...EXTENDED_MULTI_VALUE_OPERATORS,
] as const;

// -------- COMPOSED TYPES --------

export type TLogicalOperator = (typeof LOGICAL_OPERATOR)[keyof typeof LOGICAL_OPERATOR];
export type TEqualityOperator = (typeof EQUALITY_OPERATOR)[keyof typeof EQUALITY_OPERATOR];
export type TCollectionOperator = (typeof COLLECTION_OPERATOR)[keyof typeof COLLECTION_OPERATOR];
export type TComparisonOperator = (typeof COMPARISON_OPERATOR)[keyof typeof COMPARISON_OPERATOR];

/**
 * Union type representing all operators that can be used in a filter condition.
 * Combines core and extended operators.
 */
export type TSupportedOperators = TCoreSupportedOperators | TExtendedSupportedOperators;

/**
 * All operators available for use in rich filters UI, including negated versions.
 */
export type TAllAvailableOperatorsForDisplay = TSupportedOperators;

// -------- RE-EXPORTS --------

export * from "./core";
export * from "./extended";
