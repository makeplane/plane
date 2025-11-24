import { compact, isEqual, sortBy } from "lodash-es";
// plane imports
import type {
  TFilterConditionNode,
  TFilterExpression,
  TFilterGroupNode,
  TFilterProperty,
  TFilterValue,
} from "@plane/types";
import { FILTER_NODE_TYPE } from "@plane/types";
// local imports
import { isConditionNode, isGroupNode } from "../types/core";
import { processGroupNode } from "../types/shared";
import { hasValidValue } from "../validators/core";
import { transformExpressionTree } from "./transformation/core";

/**
 * Creates a comparable representation of a condition for deep comparison.
 * This uses property, operator, and value instead of ID for comparison.
 * IDs are completely excluded to avoid UUID comparison issues.
 * @param condition - The condition to create a comparable representation for
 * @returns A comparable object without ID
 */
const createConditionComparable = <P extends TFilterProperty>(condition: TFilterConditionNode<P, TFilterValue>) => ({
  // Explicitly exclude: id (random UUID should not be compared)
  type: condition.type,
  property: condition.property,
  operator: condition.operator,
  value: Array.isArray(condition.value) ? condition.value : [condition.value],
});

/**
 * Helper function to create comparable children for AND/OR groups.
 * This eliminates code duplication between AND and OR group processing.
 */
const createComparableChildren = <P extends TFilterProperty>(
  children: TFilterExpression<P>[],
  baseComparable: Record<string, unknown>
): Record<string, unknown> => {
  const childrenComparable = compact(children.map((child) => createExpressionComparable(child)));

  // Sort children by a consistent key for comparison to ensure order doesn't affect equality
  const sortedChildren = sortBy(childrenComparable, (child) => {
    if (child?.type === FILTER_NODE_TYPE.CONDITION) {
      return `condition_${child.property}_${child.operator}_${JSON.stringify(child.value)}`;
    }
    // For nested groups, sort by logical operator and recursive structure
    if (child?.type === FILTER_NODE_TYPE.GROUP) {
      const childrenCount = child.child ? 1 : Array.isArray(child.children) ? child.children.length : 0;
      return `group_${child.logicalOperator}_${childrenCount}_${JSON.stringify(child)}`;
    }
    return "unknown";
  });

  return {
    ...baseComparable,
    children: sortedChildren,
  };
};

/**
 * Creates a comparable representation of a group for deep comparison.
 * This recursively creates comparable representations for all children.
 * IDs are completely excluded to avoid UUID comparison issues.
 * Uses processGroupNode for consistent group type handling.
 * @param group - The group to create a comparable representation for
 * @returns A comparable object without ID
 */
export const createGroupComparable = <P extends TFilterProperty>(
  group: TFilterGroupNode<P>
): Record<string, unknown> => {
  const baseComparable = {
    // Explicitly exclude: id (random UUID should not be compared)
    type: group.type,
    logicalOperator: group.logicalOperator,
  };

  return processGroupNode(group, {
    onAndGroup: (andGroup) => createComparableChildren(andGroup.children, baseComparable),
  });
};

/**
 * Creates a comparable representation of any filter expression.
 * Recursively handles deep nesting of groups within groups.
 * Completely excludes IDs from comparison to avoid UUID issues.
 * @param expression - The expression to create a comparable representation for
 * @returns A comparable object without IDs or null if the expression is empty
 */
export const createExpressionComparable = <P extends TFilterProperty>(
  expression: TFilterExpression<P> | null
): Record<string, unknown> | null => {
  if (!expression) return null;

  // Handle condition nodes - exclude ID completely
  if (isConditionNode(expression)) {
    return createConditionComparable(expression);
  }

  // Handle group nodes - exclude ID completely and support deep nesting
  if (isGroupNode(expression)) {
    return createGroupComparable(expression);
  }

  // Should never reach here with proper typing, but return null for safety
  return null;
};

/**
 * Normalizes a filter expression by removing empty conditions and groups.
 * This helps compare expressions by focusing only on meaningful content.
 * Uses the transformExpressionTree utility for consistent tree processing.
 * @param expression - The filter expression to normalize
 * @returns The normalized expression or null if the entire expression is empty
 */
export const normalizeFilterExpression = <P extends TFilterProperty>(
  expression: TFilterExpression<P> | null
): TFilterExpression<P> | null => {
  const result = transformExpressionTree<P>(expression, (node: TFilterExpression<P>) => {
    // Only transform condition nodes - check if they have valid values
    if (isConditionNode(node)) {
      return {
        expression: hasValidValue(node.value) ? node : null,
        shouldNotify: false,
      };
    }
    // For group nodes, let the generic transformer handle the recursion
    return { expression: node, shouldNotify: false };
  });

  return result.expression;
};

/**
 * Performs a deep comparison of two filter expressions based on their meaningful content.
 * This comparison completely ignores IDs (UUIDs) and focuses on property, operator, value, and tree structure.
 * Empty conditions and groups are normalized before comparison.
 * Supports deep nesting of groups within groups recursively.
 * @param expression1 - The first expression to compare
 * @param expression2 - The second expression to compare
 * @returns True if the expressions are meaningfully equal, false otherwise
 */
export const deepCompareFilterExpressions = <P extends TFilterProperty>(
  expression1: TFilterExpression<P> | null,
  expression2: TFilterExpression<P> | null
): boolean => {
  // Normalize both expressions to remove empty conditions and groups
  const normalized1 = normalizeFilterExpression(expression1);
  const normalized2 = normalizeFilterExpression(expression2);

  // If both are null after normalization, they're equal
  if (!normalized1 && !normalized2) {
    return true;
  }

  // If one is null and the other isn't, they're different
  if (!normalized1 || !normalized2) {
    return false;
  }

  // Create comparable representations (IDs completely excluded)
  const comparable1 = createExpressionComparable(normalized1);
  const comparable2 = createExpressionComparable(normalized2);

  // Deep compare using lodash isEqual for reliable object comparison
  // This handles deep nesting recursively and ignores UUID differences
  return isEqual(comparable1, comparable2);
};
