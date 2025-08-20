import get from "lodash/get";
// plane imports
import {
  COLLECTION_OPERATORS,
  COMPARISON_OPERATORS,
  EQUALITY_OPERATORS,
  FILTER_TYPE_OPERATORS_MAP,
  TAllOperators,
  TFilterType,
} from "@plane/types";

/**
 * Get the label for a filter operator
 * @param operator - The operator to get the label for
 * @returns The label for the operator
 */
export const getOperatorLabel = (operator: TAllOperators): string => {
  const operatorLabels: Record<TAllOperators, string> = {
    [EQUALITY_OPERATORS.IS]: "is",
    [EQUALITY_OPERATORS.IS_NOT]: "is not",
    [COLLECTION_OPERATORS.IN]: "is any of",
    [COLLECTION_OPERATORS.NOT_IN]: "is not any of",
    [COMPARISON_OPERATORS.BETWEEN]: "between",
    [COMPARISON_OPERATORS.NOT_BETWEEN]: "not between",
  };

  return get(operatorLabels, operator, "");
};

/**
 * Get the valid operators for a filter type
 * @param type - The type of filter to get the valid operators for
 * @returns The valid operators for the filter type
 */
export const getValidOperatorsForType = <T extends TFilterType>(
  type: T,
  customOperators?: TAllOperators[]
): readonly TAllOperators[] => {
  if (customOperators) {
    return customOperators;
  }
  return FILTER_TYPE_OPERATORS_MAP[type] as readonly TAllOperators[];
};
