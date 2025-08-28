// plane imports
import {
  FILTER_NODE_TYPE,
  TFilterAndGroupNode,
  TFilterConditionPayload,
  TFilterExpression,
  TFilterGroupNode,
  TFilterNotGroupNode,
  TFilterOrGroupNode,
  TFilterProperty,
  TFilterValue,
} from "@plane/types";
// local imports
import { createAndGroupNode, createOrGroupNode } from "./creation";
import { getGroupChildren, isAndGroupNode, isNotGroupNode, isOrGroupNode } from "./types";
import { shouldNotifyChangeForValue, shouldUnwrapGroup } from "./validation";

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
  if (expression.type === FILTER_NODE_TYPE.CONDITION) {
    return createAndGroupNode([expression, condition]);
  }
  // if the expression is a group, and the group is an AND group, add the new condition to the group
  if (expression.type === FILTER_NODE_TYPE.GROUP && isAndGroupNode(expression)) {
    expression.children.push(condition);
    return expression;
  }
  // if the expression is a group, but not an AND group, create a new AND group and add the new condition to it
  if (expression.type === FILTER_NODE_TYPE.GROUP && !isAndGroupNode(expression)) {
    return createAndGroupNode([expression, condition]);
  }
  // Throw error for unexpected expression type
  console.error("Invalid expression type", expression);
  return expression;
};

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
  if (expression.type === FILTER_NODE_TYPE.CONDITION) {
    return createOrGroupNode([expression, condition]);
  }
  // if the expression is a group, and the group is an OR group, add the new condition to the group
  if (expression.type === FILTER_NODE_TYPE.GROUP && isOrGroupNode(expression)) {
    expression.children.push(condition);
    return expression;
  }
  // if the expression is a group, but not an OR group, create a new OR group and add the new condition to it
  if (expression.type === FILTER_NODE_TYPE.GROUP && !isOrGroupNode(expression)) {
    return createOrGroupNode([expression, condition]);
  }
  // Throw error for unexpected expression type
  console.error("Invalid expression type", expression);
  return expression;
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

/**
 * Updates a node in the filter expression.
 * @param expression - The filter expression to update
 * @param targetId - The id of the node to update
 * @param updates - The updates to apply to the node
 */
export const updateNodeInExpression = <P extends TFilterProperty>(
  expression: TFilterExpression<P>,
  targetId: string,
  updates: Partial<TFilterConditionPayload<P, TFilterValue>>
) => {
  // if the expression is a condition, update the condition
  if (expression.id === targetId) {
    Object.assign(expression, updates);
    return;
  }
  // if the expression is a group, check if the group has the target id
  if (expression.type === FILTER_NODE_TYPE.GROUP) {
    const children = getGroupChildren(expression);
    children.forEach((child) => updateNodeInExpression(child, targetId, updates));
  }
};

/**
 * Removes a node from the filter expression.
 * @param expression - The filter expression to remove the node from
 * @param targetId - The id of the node to remove
 * @returns An object containing the updated filter expression and whether to notify about the change
 */
export const removeNodeFromExpression = <P extends TFilterProperty>(
  expression: TFilterExpression<P>,
  targetId: string
): { expression: TFilterExpression<P> | null; shouldNotify: boolean } => {
  // if the expression is a condition and matches the target id
  if (expression.id === targetId) {
    // Check if we should notify based on the value
    const shouldNotify =
      expression.type === FILTER_NODE_TYPE.CONDITION ? shouldNotifyChangeForValue(expression.value) : true;
    return { expression: null, shouldNotify };
  }

  // if the expression is a group, check if the group has the target id
  if (expression.type === FILTER_NODE_TYPE.GROUP) {
    let groupShouldNotify = false;
    const children = getGroupChildren(expression);

    if (isNotGroupNode(expression)) {
      // For NOT groups, we have a single child
      const result = removeNodeFromExpression(expression.child, targetId);
      if (result.expression === null) {
        return { expression: null, shouldNotify: result.shouldNotify };
      }

      // If child was updated but not removed, update the NOT group
      if (result.expression !== expression.child) {
        const updatedNotGroup: TFilterNotGroupNode<P> = {
          ...expression,
          child: result.expression,
        };
        return {
          expression: updatedNotGroup,
          shouldNotify: result.shouldNotify,
        };
      }

      return { expression, shouldNotify: result.shouldNotify };
    } else {
      // For AND/OR groups, we have multiple children
      const newChildren: TFilterExpression<P>[] = [];

      for (const child of children) {
        const result = removeNodeFromExpression(child, targetId);
        if (result.expression !== null) {
          newChildren.push(result.expression);
        }
        // Track if any removal should trigger notification
        if (result.shouldNotify) {
          groupShouldNotify = true;
        }
      }

      // if the group has no children, return null
      if (newChildren.length === 0) {
        return { expression: null, shouldNotify: groupShouldNotify };
      }

      // Create updated group with remaining children based on the original type
      if (isAndGroupNode(expression)) {
        const updatedGroup: TFilterAndGroupNode<P> = {
          ...expression,
          children: newChildren,
        };
        const finalExpression = unwrapGroupIfNeeded(updatedGroup, true);
        return {
          expression: finalExpression,
          shouldNotify: groupShouldNotify,
        };
      } else if (isOrGroupNode(expression)) {
        const updatedGroup: TFilterOrGroupNode<P> = {
          ...expression,
          children: newChildren,
        };
        const finalExpression = unwrapGroupIfNeeded(updatedGroup, true);
        return {
          expression: finalExpression,
          shouldNotify: groupShouldNotify,
        };
      }

      // This should never be reached with proper typing
      throw new Error("Unknown group type in removeNodeFromExpression");
    }
  }

  return { expression, shouldNotify: false };
};
