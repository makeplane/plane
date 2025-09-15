/**
 * Extended logical operators
 */
export const EXTENDED_LOGICAL_OPERATOR = {} as const;

/**
 * Extended equality operators
 */
export const EXTENDED_EQUALITY_OPERATOR = {} as const;

/**
 * Extended collection operators
 */
export const EXTENDED_COLLECTION_OPERATOR = {} as const;

/**
 * Extended comparison operators
 */
export const EXTENDED_COMPARISON_OPERATOR = {} as const;

// -------- TYPE EXPORTS --------

type TExtendedEqualityOperator = (typeof EXTENDED_EQUALITY_OPERATOR)[keyof typeof EXTENDED_EQUALITY_OPERATOR];
type TExtendedCollectionOperator = (typeof EXTENDED_COLLECTION_OPERATOR)[keyof typeof EXTENDED_COLLECTION_OPERATOR];
type TExtendedComparisonOperator = (typeof EXTENDED_COMPARISON_OPERATOR)[keyof typeof EXTENDED_COMPARISON_OPERATOR];

/**
 * All extended operators that can be used in filter conditions
 */
export type TExtendedSupportedOperators =
  | TExtendedEqualityOperator
  | TExtendedCollectionOperator
  | TExtendedComparisonOperator;
