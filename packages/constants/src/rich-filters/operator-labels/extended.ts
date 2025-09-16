import {
  EXTENDED_COMPARISON_OPERATOR,
  TExtendedSupportedOperators,
  TSupportedOperators,
  TSupportedDateFilterOperators,
} from "@plane/types";

/**
 * Extended operator labels
 */
export const EXTENDED_OPERATOR_LABELS_MAP: Record<TExtendedSupportedOperators, string> = {
  [EXTENDED_COMPARISON_OPERATOR.LESS_THAN]: "less than",
  [EXTENDED_COMPARISON_OPERATOR.LESS_THAN_OR_EQUAL_TO]: "less than or equal",
  [EXTENDED_COMPARISON_OPERATOR.GREATER_THAN]: "greater than",
  [EXTENDED_COMPARISON_OPERATOR.GREATER_THAN_OR_EQUAL_TO]: "greater than or equal",
} as const;

/**
 * Extended date-specific operator labels
 */
export const EXTENDED_DATE_OPERATOR_LABELS_MAP: Record<TExtendedSupportedOperators, string> = {
  [EXTENDED_COMPARISON_OPERATOR.LESS_THAN]: "before",
  [EXTENDED_COMPARISON_OPERATOR.LESS_THAN_OR_EQUAL_TO]: "before or on",
  [EXTENDED_COMPARISON_OPERATOR.GREATER_THAN]: "after",
  [EXTENDED_COMPARISON_OPERATOR.GREATER_THAN_OR_EQUAL_TO]: "after or on",
} as const;

/**
 * Negated operator labels for all operators
 */
export const NEGATED_OPERATOR_LABELS_MAP: Record<`-${TSupportedOperators}`, string> = {
  "-exact": "is not",
  "-in": "is not any of",
  "-range": "not between",
  "-lt": "not less than",
  "-lte": "not less than or equal",
  "-gt": "not greater than",
  "-gte": "not greater than or equal",
} as const;

/**
 * Negated date operator labels for all date operators
 */
export const NEGATED_DATE_OPERATOR_LABELS_MAP: Record<`-${TSupportedDateFilterOperators}`, string> = {
  "-exact": "is not",
  "-range": "not between",
  "-lt": "not before",
  "-lte": "not before or on",
  "-gt": "not after",
  "-gte": "not after or on",
} as const;
