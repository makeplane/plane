import {
  FILTER_NODE_TYPE,
  LOGICAL_OPERATOR,
  TFilterAndGroupNode,
  TFilterConditionNode,
  TFilterExpression,
  TFilterGroupNode,
  TFilterNotGroupNode,
  TFilterOrGroupNode,
  TFilterProperty,
  TFilterValue,
} from "@plane/types";

/**
 * Type guard to check if a node is a condition node.
 * @param node - The node to check
 * @returns True if the node is a condition node
 */
export const isConditionNode = <P extends TFilterProperty, V extends TFilterValue>(
  node: TFilterExpression<P>
): node is TFilterConditionNode<P, V> => node.type === FILTER_NODE_TYPE.CONDITION;

/**
 * Type guard to check if a group node is an AND group.
 * @param group - The group node to check
 * @returns True if the group is an AND group
 */
export const isAndGroupNode = <P extends TFilterProperty>(
  group: TFilterGroupNode<P>
): group is TFilterAndGroupNode<P> => group.logicalOperator === LOGICAL_OPERATOR.AND;

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
 * Type guard to check if a group node has children property (AND/OR groups).
 * @param group - The group node to check
 * @returns True if the group has children property
 */
export const hasChildrenProperty = <P extends TFilterProperty>(
  group: TFilterGroupNode<P>
): group is TFilterAndGroupNode<P> | TFilterOrGroupNode<P> => {
  const groupWithChildren = group as { children?: unknown };
  return "children" in group && Array.isArray(groupWithChildren.children);
};

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
 * Safely gets the children array from an AND group node.
 * @param group - The AND group node
 * @returns The children array
 */
export const getAndGroupChildren = <P extends TFilterProperty>(group: TFilterAndGroupNode<P>): TFilterExpression<P>[] =>
  group.children;

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

/**
 * Gets the children of a group node, handling both AND/OR groups (children array) and NOT groups (single child).
 * @param group - The group node to get children from
 * @returns Array of child expressions
 */
export const getGroupChildren = <P extends TFilterProperty>(group: TFilterGroupNode<P>): TFilterExpression<P>[] => {
  if (isNotGroupNode(group)) {
    return [getNotGroupChild(group)];
  }
  if (isAndGroupNode(group)) {
    return getAndGroupChildren(group);
  }
  if (isOrGroupNode(group)) {
    return getOrGroupChildren(group);
  }
  throw new Error(`Invalid group node: unknown logical operator ${group}`);
};
