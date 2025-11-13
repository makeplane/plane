import { get } from "lodash-es";
// plane imports
import { DATE_OPERATOR_LABELS_MAP, EMPTY_OPERATOR_LABEL, OPERATOR_LABELS_MAP } from "@plane/constants";
import type {
  TAllAvailableOperatorsForDisplay,
  TFilterValue,
  TAllAvailableDateFilterOperatorsForDisplay,
} from "@plane/types";

// -------- OPERATOR LABEL UTILITIES --------

/**
 * Get the label for a filter operator
 * @param operator - The operator to get the label for
 * @returns The label for the operator
 */
export const getOperatorLabel = (operator: TAllAvailableOperatorsForDisplay | undefined): string => {
  if (!operator) return EMPTY_OPERATOR_LABEL;
  return get(OPERATOR_LABELS_MAP, operator, EMPTY_OPERATOR_LABEL);
};

/**
 * Get the label for a date filter operator
 * @param operator - The operator to get the label for
 * @returns The label for the operator
 */
export const getDateOperatorLabel = (operator: TAllAvailableDateFilterOperatorsForDisplay | undefined): string => {
  if (!operator) return EMPTY_OPERATOR_LABEL;
  return get(DATE_OPERATOR_LABELS_MAP, operator, EMPTY_OPERATOR_LABEL);
};

// -------- OPERATOR TYPE GUARDS --------

/**
 * Type guard to check if an operator supports date filter types.
 * @param operator - The operator to check
 * @returns True if the operator supports date filters
 */
export const isDateFilterOperator = <V extends TFilterValue = TFilterValue>(
  operator: TAllAvailableOperatorsForDisplay
): operator is TAllAvailableDateFilterOperatorsForDisplay<V> =>
  Object.keys(DATE_OPERATOR_LABELS_MAP).includes(operator);
