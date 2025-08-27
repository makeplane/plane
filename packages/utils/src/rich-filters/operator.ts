import get from "lodash/get";
// plane imports
import {
  COLLECTION_OPERATORS,
  COMPARISON_OPERATORS,
  EQUALITY_OPERATORS,
  FILTER_TYPE_OPERATORS_MAP,
  MANY_TO_ONE_OPERATOR_MAP,
  NEGATION_OPERATORS,
  NEGATION_TO_POSITIVE_OPERATOR_MAP,
  ONE_TO_MANY_OPERATOR_MAP,
  POSITIVE_TO_NEGATION_OPERATOR_MAP,
  SingleOrArray,
  TAllOperators,
  TFilterConditionNode,
  TFilterProperty,
  TFilterType,
  TFilterValue,
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

  return get(operatorLabels, operator, "--");
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

/**
 * Checks if an operator is a multi-value operator (IN, NOT_IN).
 * @param operator - The operator to check
 * @returns True if the operator is a multi-value operator, false otherwise
 */
export const isMultiValueOperator = (operator: TAllOperators): boolean =>
  // Check if the operator is in the keys of MANY_TO_ONE_OPERATOR_MAP (IN, NOT_IN)
  Object.keys(MANY_TO_ONE_OPERATOR_MAP).includes(operator);

/**
 * Checks if an operator is a single-value operator (IS, IS_NOT).
 * @param operator - The operator to check
 * @returns True if the operator is a single-value operator, false otherwise
 */
export const isSingleValueOperator = (operator: TAllOperators): boolean =>
  // Check if the operator is in the keys of ONE_TO_MANY_OPERATOR_MAP (IS, IS_NOT)
  Object.keys(ONE_TO_MANY_OPERATOR_MAP).includes(operator);

/**
 * Checks if an operator is a negation operator.
 * @param operator - The operator to check
 * @returns True if the operator is a negation operator, false otherwise
 */
export const isNegationOperator = (operator: TAllOperators): boolean =>
  (NEGATION_OPERATORS as readonly string[]).includes(operator);

/**
 * Gets the positive counterpart of a negation operator.
 * @param negationOperator - The negation operator to convert
 * @returns The positive operator or the original operator if not a negation operator
 */
export const getPositiveOperator = (negationOperator: TAllOperators): TAllOperators =>
  (NEGATION_TO_POSITIVE_OPERATOR_MAP as Record<TAllOperators, TAllOperators>)[negationOperator] || negationOperator;

/**
 * Gets the negative counterpart of a positive operator.
 * @param positiveOperator - The positive operator to convert
 * @returns The negative operator
 */
export const getNegativeOperator = (positiveOperator: TAllOperators): TAllOperators =>
  (POSITIVE_TO_NEGATION_OPERATOR_MAP as Record<TAllOperators, TAllOperators>)[positiveOperator] || positiveOperator;

/**
 * Checks if an operator should be upgraded from single-value to multi-value based on value count.
 * @param operator - The current operator
 * @param valueCount - The number of values
 * @returns True if the operator should be upgraded
 */
export const shouldUpgradeOperator = (operator: TAllOperators, valueCount: number): boolean => {
  if (valueCount <= 1) return false;
  return Object.keys(ONE_TO_MANY_OPERATOR_MAP).includes(operator);
};

/**
 * Checks if an operator should be downgraded from multi-value to single-value based on value count.
 * @param operator - The current operator
 * @param valueCount - The number of values
 * @returns True if the operator should be downgraded
 */
export const shouldDowngradeOperator = (operator: TAllOperators, valueCount: number): boolean => {
  if (valueCount > 1) return false;
  return Object.keys(MANY_TO_ONE_OPERATOR_MAP).includes(operator);
};

/**
 * Upgrades a single-value operator to its multi-value equivalent.
 * @param operator - The operator to upgrade
 * @returns The upgraded operator
 */
export const upgradeOperator = (operator: TAllOperators): TAllOperators =>
  (ONE_TO_MANY_OPERATOR_MAP as Record<TAllOperators, TAllOperators>)[operator] || operator;

/**
 * Downgrades a multi-value operator to its single-value equivalent.
 * @param operator - The operator to downgrade
 * @returns The downgraded operator
 */
export const downgradeOperator = (operator: TAllOperators): TAllOperators =>
  (MANY_TO_ONE_OPERATOR_MAP as Record<TAllOperators, TAllOperators>)[operator] || operator;

/**
 * Transforms a single value to array format for multi-value operators.
 * @param value - The single value to transform
 * @returns The value as an array
 */
export const transformSingleValueToArray = (value: SingleOrArray<TFilterValue>): SingleOrArray<TFilterValue> => {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined) return value;
  return [value] as SingleOrArray<TFilterValue>;
};

/**
 * Transforms an array value to single value format for single-value operators.
 * @param value - The array value to transform
 * @returns The first non-null value from the array, or null if empty
 */
export const transformArrayValueToSingle = (value: SingleOrArray<TFilterValue>): SingleOrArray<TFilterValue> => {
  if (!Array.isArray(value)) return value;
  if (value.length === 0) return null;
  return value[0] ?? null;
};

/**
 * Transforms a value based on operator upgrade/downgrade requirements.
 * @param value - The current value
 * @param currentOperator - The current operator
 * @param newOperator - The new operator
 * @returns The transformed value appropriate for the new operator
 */
export const transformValueForOperator = (
  value: SingleOrArray<TFilterValue>,
  currentOperator: TAllOperators,
  newOperator: TAllOperators
): SingleOrArray<TFilterValue> => {
  // If operators are the same, no transformation needed
  if (currentOperator === newOperator) return value;

  const currentIsMultiValue = isMultiValueOperator(currentOperator);
  const newIsMultiValue = isMultiValueOperator(newOperator);

  // Upgrading from single-value to multi-value
  if (!currentIsMultiValue && newIsMultiValue) {
    return transformSingleValueToArray(value);
  }

  // Downgrading from multi-value to single-value
  if (currentIsMultiValue && !newIsMultiValue) {
    return transformArrayValueToSingle(value);
  }

  // No transformation needed for other cases
  return value;
};

/**
 * Gets a list of operators that are valid for a specific condition.
 * @param condition - The condition node to check
 * @param allOperators - All possible operators
 * @returns An array of operators that are valid for the specific condition
 */
export const getValidOperatorsForCondition = <P extends TFilterProperty>(
  condition: TFilterConditionNode<P, TFilterValue>,
  allOperators: readonly TAllOperators[]
) => {
  const valueCount = Array.isArray(condition.value)
    ? condition.value.length
    : condition.value !== null && condition.value !== undefined
      ? 1
      : 0;

  return allOperators.filter((operator) => {
    // For single value (0 or 1 items), show single-value operators (IS, IS_NOT)
    if (valueCount <= 1) {
      return isSingleValueOperator(operator);
    }

    // For multiple values, show multi-value operators (IN, NOT_IN)
    return isMultiValueOperator(operator);
  });
};
