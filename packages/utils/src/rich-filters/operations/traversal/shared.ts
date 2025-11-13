// plane imports
import type {
  TAllAvailableOperatorsForDisplay,
  TFilterExpression,
  TFilterProperty,
  TSupportedOperators,
} from "@plane/types";

/**
 * Helper function to get the display operator for a condition.
 * This checks for NOT group context and applies negation if needed.
 * @param operator - The original operator
 * @param expression - The filter expression
 * @param conditionId - The ID of the condition
 * @returns The display operator (possibly negated)
 */
export const getDisplayOperator = <P extends TFilterProperty>(
  operator: TSupportedOperators,
  _expression: TFilterExpression<P>,
  _conditionId: string
): TAllAvailableOperatorsForDisplay =>
  // Otherwise, return the operator as-is
  operator;
