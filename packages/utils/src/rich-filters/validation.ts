import {
  FILTER_NODE_TYPE,
  SingleOrArray,
  TFilterExpression,
  TFilterGroupNode,
  TFilterProperty,
  TFilterValue,
} from "@plane/types";
// local imports
import { getGroupChildren, isNotGroupNode } from "./types";

/**
 * Determines if a group should be unwrapped based on the number of children and group type.
 * @param group - The group node to check
 * @param preserveNotGroups - Whether to preserve NOT groups even with single children
 * @returns True if the group should be unwrapped, false otherwise
 */
export const shouldUnwrapGroup = <P extends TFilterProperty>(group: TFilterGroupNode<P>, preserveNotGroups = true) => {
  const children = getGroupChildren(group);

  // Never unwrap groups with multiple children
  if (children.length !== 1) {
    return false;
  }

  // If preserveNotGroups is true, don't unwrap NOT groups
  if (preserveNotGroups && isNotGroupNode(group)) {
    return false;
  }

  // Unwrap AND/OR groups with single children, and NOT groups if preserveNotGroups is false
  return true;
};

/**
 * Determines whether to notify about a change based on the filter value.
 * @param value - The filter value to check
 * @returns True if we should notify, false otherwise
 */
export const shouldNotifyChangeForValue = (value: SingleOrArray<TFilterValue>): boolean => {
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
  if (expression.type === FILTER_NODE_TYPE.CONDITION) {
    return shouldNotifyChangeForValue(expression.value);
  }

  // If it's a group, check if any of its children have meaningful values
  if (expression.type === FILTER_NODE_TYPE.GROUP) {
    const children = getGroupChildren(expression);
    return children.some((child) => shouldNotifyChangeForExpression(child));
  }

  return false;
};
