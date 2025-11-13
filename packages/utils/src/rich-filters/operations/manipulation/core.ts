// plane imports
import type {
  TFilterConditionPayload,
  TFilterExpression,
  TFilterGroupNode,
  TFilterProperty,
  TFilterValue,
} from "@plane/types";
// local imports
import { createAndGroupNode } from "../../factories/nodes/core";
import { getGroupChildren } from "../../types";
import { isAndGroupNode, isConditionNode, isGroupNode } from "../../types/core";
import { shouldUnwrapGroup } from "../../validators/shared";
import { transformExpressionTree } from "../transformation/core";

/**
 * Adds an AND condition to the filter expression.
 * @param expression - The current filter expression
 * @param condition - The condition to add
 * @returns The updated filter expression
 */
export const addAndCondition = <P extends TFilterProperty>(
  expression: TFilterExpression<P> | null,
  condition: TFilterExpression<P>
): TFilterExpression<P> => {
  // if no expression, set the new condition
  if (!expression) {
    return condition;
  }
  // if the expression is a condition, convert it to an AND group
  if (isConditionNode(expression)) {
    return createAndGroupNode([expression, condition]);
  }
  // if the expression is a group, and the group is an AND group, add the new condition to the group
  if (isGroupNode(expression) && isAndGroupNode(expression)) {
    expression.children.push(condition);
    return expression;
  }
  // if the expression is a group, but not an AND group, create a new AND group and add the new condition to it
  if (isGroupNode(expression) && !isAndGroupNode(expression)) {
    return createAndGroupNode([expression, condition]);
  }
  // Throw error for unexpected expression type
  console.error("Invalid expression type", expression);
  return expression;
};

/**
 * Replaces a node in the expression tree with another node.
 * Uses transformExpressionTree for consistent tree processing and better maintainability.
 * @param expression - The expression tree to search in
 * @param targetId - The ID of the node to replace
 * @param replacement - The node to replace with
 * @returns The updated expression tree
 */
export const replaceNodeInExpression = <P extends TFilterProperty>(
  expression: TFilterExpression<P>,
  targetId: string,
  replacement: TFilterExpression<P>
): TFilterExpression<P> => {
  const result = transformExpressionTree(expression, (node: TFilterExpression<P>) => {
    // If this is the node we want to replace, return the replacement
    if (node.id === targetId) {
      return {
        expression: replacement,
        shouldNotify: false,
      };
    }
    // For all other nodes, let the generic transformer handle the recursion
    return { expression: node, shouldNotify: false };
  });

  // Since we're doing a replacement, the result should never be null
  return result.expression || expression;
};

/**
 * Updates a node in the filter expression.
 * Uses recursive tree traversal with proper type handling.
 * @param expression - The filter expression to update
 * @param targetId - The id of the node to update
 * @param updates - The updates to apply to the node
 */
export const updateNodeInExpression = <P extends TFilterProperty>(
  expression: TFilterExpression<P>,
  targetId: string,
  updates: Partial<TFilterConditionPayload<P, TFilterValue>>
) => {
  // Helper function to recursively update nodes
  const updateNode = (node: TFilterExpression<P>): void => {
    if (node.id === targetId) {
      if (!isConditionNode<P, TFilterValue>(node)) {
        console.warn("updateNodeInExpression: targetId matched a group; ignoring updates");
        return;
      }
      Object.assign(node, updates);
      return;
    }

    if (isGroupNode(node)) {
      const children = getGroupChildren(node);
      children.forEach((child) => updateNode(child));
    }
  };

  updateNode(expression);
};

/**
 * Unwraps a group if it meets the unwrapping criteria, otherwise returns the group.
 * @param group - The group node to potentially unwrap
 * @param preserveNotGroups - Whether to preserve NOT groups even with single children
 * @returns The unwrapped child or the original group
 */
export const unwrapGroupIfNeeded = <P extends TFilterProperty>(
  group: TFilterGroupNode<P>,
  preserveNotGroups = true
) => {
  if (shouldUnwrapGroup(group, preserveNotGroups)) {
    const children = getGroupChildren(group);
    return children[0];
  }
  return group;
};
