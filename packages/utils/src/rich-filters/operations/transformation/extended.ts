// plane imports
import { TFilterGroupNode, TFilterNotGroupNode, TFilterProperty } from "@plane/types";
// local imports
import { unwrapGroupIfNeeded } from "../manipulation/core";
import { TTreeTransformFn, TTreeTransformResult, transformExpressionTree } from "./core";

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
 * Transforms a NOT group by processing its single child.
 * Handles all NOT group specific logic including null checks and change detection.
 */
export const transformNotGroup = <P extends TFilterProperty>(
  notGroup: TFilterNotGroupNode<P>,
  transformFn: TTreeTransformFn<P>
): TTreeTransformResult<P> => {
  const childResult = transformExpressionTree(notGroup.child, transformFn);

  // If child was removed, remove the entire NOT group
  if (childResult.expression === null) {
    return { expression: null, shouldNotify: childResult.shouldNotify || false };
  }

  // If child wasn't changed, return original group
  if (childResult.expression === notGroup.child) {
    return { expression: notGroup, shouldNotify: childResult.shouldNotify || false };
  }

  // Create updated NOT group with transformed child
  const updatedNotGroup: TFilterNotGroupNode<P> = {
    ...notGroup,
    child: childResult.expression,
  };

  return createGroupTransformResult(updatedNotGroup, childResult.shouldNotify || false);
};
