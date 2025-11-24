// plane imports
import type { SingleOrArray, TFilterExpression, TFilterProperty, TFilterValue } from "@plane/types";
// local imports
import { getGroupChildren } from "../types";
import { isConditionNode, isGroupNode } from "../types/core";

/**
 * Determines whether to notify about a change based on the filter value.
 * @param value - The filter value to check
 * @returns True if we should notify, false otherwise
 */
export const hasValidValue = (value: SingleOrArray<TFilterValue>): boolean => {
  if (value === null || value === undefined) {
    return false;
  }

  // If it's an array, check if it's empty or contains only null/undefined values
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return false;
    }
    return value.some((v) => v !== null && v !== undefined);
  }

  return true;
};

/**
 * Determines whether to notify about a change based on the entire filter expression.
 * @param expression - The filter expression to check
 * @returns True if we should notify, false otherwise
 */
export const shouldNotifyChangeForExpression = <P extends TFilterProperty>(
  expression: TFilterExpression<P> | null
): boolean => {
  if (!expression) {
    return false;
  }

  // If it's a condition, check its value
  if (isConditionNode(expression)) {
    return hasValidValue(expression.value);
  }

  // If it's a group, check if any of its children have meaningful values
  if (isGroupNode(expression)) {
    const children = getGroupChildren(expression);
    return children.some((child) => shouldNotifyChangeForExpression(child));
  }

  return false;
};
