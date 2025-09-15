// plane imports
import { FILTER_NODE_TYPE, TFilterConditionNode, TFilterExpression, TFilterProperty, TFilterValue } from "@plane/types";
// local imports
import { createNotGroupNode } from "./creation";
import { findImmediateParent, findNodeById, replaceNodeInExpression } from "./tree";
import { isNotGroupNode } from "./types";

/**
 * Wraps a condition node in a NOT group.
 * @param conditionNode - The condition node to wrap
 * @returns A NOT group containing the condition
 */
export const wrapInNotGroup = <P extends TFilterProperty>(conditionNode: TFilterConditionNode<P, TFilterValue>) =>
  createNotGroupNode(conditionNode);

/**
 * Checks if a condition is directly wrapped in a NOT group.
 * @param expression - The filter expression to check in
 * @param conditionId - The ID of the condition to check
 * @returns True if the condition is directly wrapped in a NOT group, false otherwise
 */
export const isDirectlyWrappedInNotGroup = <P extends TFilterProperty>(
  expression: TFilterExpression<P> | null,
  conditionId: string
): boolean => {
  if (!expression) return false;
  const immediateParent = findImmediateParent(expression, conditionId);
  return immediateParent !== null && isNotGroupNode(immediateParent);
};

/**
 * Unwraps a condition from its NOT group parent and restructures the expression.
 * @param expression - The filter expression to operate on
 * @param conditionId - The ID of the condition to unwrap
 * @returns The updated expression after unwrapping, or null if no changes were made
 */
export const unwrapFromNotGroup = <P extends TFilterProperty>(
  expression: TFilterExpression<P>,
  conditionId: string
): TFilterExpression<P> | null => {
  if (!expression) return null;

  const immediateParent = findImmediateParent(expression, conditionId);
  if (!immediateParent || !isNotGroupNode(immediateParent)) {
    return expression; // No unwrapping needed
  }

  // Find the condition node
  const conditionNode = findNodeById(expression, conditionId);
  if (!conditionNode || conditionNode.type !== FILTER_NODE_TYPE.CONDITION) {
    return expression;
  }

  // For NOT groups, there should only be one child by design
  if (isNotGroupNode(immediateParent)) {
    // Replace the entire NOT group with the condition
    return replaceNodeInExpression(expression, immediateParent.id, conditionNode);
  }

  // Fallback: return original expression if no changes were made
  return expression;
};
