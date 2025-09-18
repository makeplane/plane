// plane imports
import { FILTER_NODE_TYPE, TFilterExpression, TFilterProperty } from "@plane/types";
// local imports
import { createOrGroupNode } from "../../factories/nodes/extended";
import { isConditionNode, isGroupNode } from "../../types/core";
import { isNotGroupNode, isOrGroupNode } from "../../types/extended";
import { findImmediateParent, findNodeById } from "../traversal/core";
import { replaceNodeInExpression } from "./core";

/**
 * Adds an OR condition to the filter expression.
 * @param expression - The current filter expression
 * @param condition - The condition to add
 * @returns The updated filter expression
 */
export const addOrCondition = <P extends TFilterProperty>(
  expression: TFilterExpression<P> | null,
  condition: TFilterExpression<P>
): TFilterExpression<P> => {
  // if no expression, set the new condition
  if (!expression) {
    return condition;
  }
  // if the expression is a condition, convert it to an OR group
  if (isConditionNode(expression)) {
    return createOrGroupNode([expression, condition]);
  }
  // if the expression is a group, and the group is an OR group, add the new condition to the group
  if (isGroupNode(expression) && isOrGroupNode(expression)) {
    expression.children.push(condition);
    return expression;
  }
  // if the expression is a group, but not an OR group, create a new OR group and add the new condition to it
  if (isGroupNode(expression) && !isOrGroupNode(expression)) {
    return createOrGroupNode([expression, condition]);
  }
  // Throw error for unexpected expression type
  console.error("Invalid expression type", expression);
  return expression;
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
