// plane imports
import type { TFilterExpression, TFilterGroupNode, TFilterProperty } from "@plane/types";
// local imports
import { isConditionNode, isGroupNode } from "../../types/core";
import { getGroupChildren } from "../../types/shared";
import { hasValidValue } from "../../validators/core";
import { unwrapGroupIfNeeded } from "../manipulation/core";
import { transformGroup } from "./shared";

/**
 * Generic tree transformation result type
 */
export type TTreeTransformResult<P extends TFilterProperty> = {
  expression: TFilterExpression<P> | null;
  shouldNotify?: boolean;
};

/**
 * Transform function type for tree processing
 */
export type TTreeTransformFn<P extends TFilterProperty> = (expression: TFilterExpression<P>) => TTreeTransformResult<P>;

/**
 * Generic recursive tree transformer that handles common tree manipulation logic.
 * This function provides a reusable way to transform expression trees while maintaining
 * tree integrity, handling group restructuring, and applying stabilization.
 *
 * @param expression - The expression to transform
 * @param transformFn - Function that defines the transformation logic for each node
 * @returns The transformation result with expression and metadata
 */
/**
 * Helper function to create a consistent transformation result for group nodes.
 * Centralizes the logic for wrapping group expressions and tracking notifications.
 */
const createGroupTransformResult = <P extends TFilterProperty>(
  groupExpression: TFilterGroupNode<P> | null,
  shouldNotify: boolean
): TTreeTransformResult<P> => ({
  expression: groupExpression ? unwrapGroupIfNeeded(groupExpression, true) : null,
  shouldNotify,
});

/**
 * Transforms groups with children by processing all children.
 * Handles child collection, null filtering, and empty group removal.
 */
export const transformGroupWithChildren = <P extends TFilterProperty>(
  group: TFilterGroupNode<P>,
  transformFn: TTreeTransformFn<P>
): TTreeTransformResult<P> => {
  const children = getGroupChildren(group);
  const transformedChildren: TFilterExpression<P>[] = [];
  let shouldNotify = false;

  // Transform all children and collect non-null results
  for (const child of children) {
    const childResult = transformExpressionTree(child, transformFn);

    if (childResult.shouldNotify) {
      shouldNotify = true;
    }

    if (childResult.expression !== null) {
      transformedChildren.push(childResult.expression);
    }
  }

  // If no children remain, remove the entire group
  if (transformedChildren.length === 0) {
    return { expression: null, shouldNotify };
  }

  // Create updated group with transformed children - type-safe without casting
  const updatedGroup: TFilterGroupNode<P> = {
    ...group,
    children: transformedChildren,
  } as TFilterGroupNode<P>;

  return createGroupTransformResult(updatedGroup, shouldNotify);
};

/**
 * Generic recursive tree transformer that handles common tree manipulation logic.
 * This function provides a reusable way to transform expression trees while maintaining
 * tree integrity, handling group restructuring, and applying stabilization.
 *
 * @param expression - The expression to transform
 * @param transformFn - Function that defines the transformation logic for each node
 * @returns The transformation result with expression and metadata
 */
export const transformExpressionTree = <P extends TFilterProperty>(
  expression: TFilterExpression<P> | null,
  transformFn: TTreeTransformFn<P>
): TTreeTransformResult<P> => {
  // Handle null expressions early
  if (!expression) {
    return { expression: null, shouldNotify: false };
  }

  // Apply the transformation function to the current node
  const transformResult = transformFn(expression);

  // If the transform function handled this node completely, return its result
  if (transformResult.expression === null || transformResult.expression !== expression) {
    return transformResult;
  }

  // Handle condition nodes (no children to transform)
  if (isConditionNode(expression)) {
    return { expression, shouldNotify: false };
  }

  // Handle group nodes by delegating to the extended transformGroup function
  if (isGroupNode(expression)) {
    return transformGroup(expression, transformFn);
  }

  throw new Error("Unknown expression type in transformExpressionTree");
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
  const result = transformExpressionTree(expression, (node) => {
    // If this node matches the target ID, remove it
    if (node.id === targetId) {
      const shouldNotify = isConditionNode(node) ? hasValidValue(node.value) : true;
      return {
        expression: null,
        shouldNotify,
      };
    }
    // For all other nodes, let the generic transformer handle the recursion
    return { expression: node, shouldNotify: false };
  });

  return {
    expression: result.expression,
    shouldNotify: result.shouldNotify || false,
  };
};

/**
 * Sanitizes and stabilizes a filter expression by removing invalid conditions and unnecessary groups.
 * This function performs deep sanitization of the entire expression tree:
 * 1. Removes condition nodes that don't have valid values
 * 2. Removes empty groups (groups with no children after sanitization)
 * 3. Unwraps single-child groups that don't need to be wrapped
 * 4. Preserves tree integrity and logical operators
 *
 * @param expression - The filter expression to sanitize
 * @returns The sanitized expression or null if no valid conditions remain
 */
export const sanitizeAndStabilizeExpression = <P extends TFilterProperty>(
  expression: TFilterExpression<P> | null
): TFilterExpression<P> | null => {
  const result = transformExpressionTree(expression, (node) => {
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
