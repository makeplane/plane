import {
  LOGICAL_OPERATOR,
  TFilterExpression,
  TFilterGroupNode,
  TFilterNotGroupNode,
  TFilterOrGroupNode,
  TFilterProperty,
} from "@plane/types";

/**
 * Type guard to check if a group node is an OR group.
 * @param group - The group node to check
 * @returns True if the group is an OR group
 */
export const isOrGroupNode = <P extends TFilterProperty>(group: TFilterGroupNode<P>): group is TFilterOrGroupNode<P> =>
  group.logicalOperator === LOGICAL_OPERATOR.OR;

/**
 * Type guard to check if a group node is a NOT group.
 * @param group - The group node to check
 * @returns True if the group is a NOT group, false if it's an AND/OR group
 */
export const isNotGroupNode = <P extends TFilterProperty>(
  group: TFilterGroupNode<P>
): group is TFilterNotGroupNode<P> => group.logicalOperator === LOGICAL_OPERATOR.NOT;

/**
 * Type guard to check if a group node has child property (NOT groups).
 * @param group - The group node to check
 * @returns True if the group has child property
 */
export const hasChildProperty = <P extends TFilterProperty>(
  group: TFilterGroupNode<P>
): group is TFilterNotGroupNode<P> => {
  const groupWithChild = group as { child?: unknown };
  return "child" in group && !Array.isArray(groupWithChild.child);
};

/**
 * Safely gets the children array from an OR group node.
 * @param group - The OR group node
 * @returns The children array
 */
export const getOrGroupChildren = <P extends TFilterProperty>(group: TFilterOrGroupNode<P>): TFilterExpression<P>[] =>
  group.children;

/**
 * Safely gets the single child from a NOT group node.
 * @param group - The NOT group node
 * @returns The single child expression
 */
export const getNotGroupChild = <P extends TFilterProperty>(group: TFilterNotGroupNode<P>): TFilterExpression<P> =>
  group.child;
