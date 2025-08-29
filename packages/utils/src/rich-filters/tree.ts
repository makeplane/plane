// plane imports
import {
  FILTER_NODE_TYPE,
  TFilterConditionNode,
  TFilterExpression,
  TFilterGroupNode,
  TFilterProperty,
  TFilterValue,
} from "@plane/types";
// local imports
import { getGroupChildren, isAndGroupNode, isNotGroupNode, isOrGroupNode } from "./types";
import { getNegativeOperator } from "./operator";

/**
 * Finds a node by its ID in the filter expression tree.
 * @param expression - The filter expression to search in
 * @param targetId - The ID of the node to find
 * @returns The found node or null if not found
 */
export const findNodeById = <P extends TFilterProperty>(
  expression: TFilterExpression<P>,
  targetId: string
): TFilterExpression<P> | null => {
  // check if the expression is the target node
  if (expression.id === targetId) {
    return expression;
  }

  // if the expression is a group, recursively search in the children
  if (expression.type === FILTER_NODE_TYPE.GROUP) {
    const children = getGroupChildren(expression);
    for (const child of children) {
      const found = findNodeById(child, targetId);
      if (found) return found;
    }
  }

  return null;
};

/**
 * Finds the parent chain of a given node ID in the filter expression tree.
 * @param expression - The filter expression to search in
 * @param targetId - The ID of the node whose parent chain to find
 * @param currentPath - Current path of parent nodes (used internally for recursion)
 * @returns Array of parent nodes from immediate parent to root, or null if not found
 */
export const findParentChain = <P extends TFilterProperty>(
  expression: TFilterExpression<P>,
  targetId: string,
  currentPath: TFilterGroupNode<P>[] = []
): TFilterGroupNode<P>[] | null => {
  // if the expression is a group, search in the children
  if (expression.type === FILTER_NODE_TYPE.GROUP) {
    const children = getGroupChildren(expression);

    // check if any direct child has the target ID
    for (const child of children) {
      if (child.id === targetId) {
        return [expression, ...currentPath];
      }
    }

    // recursively search in child groups
    for (const child of children) {
      if (child.type === FILTER_NODE_TYPE.GROUP) {
        const chain = findParentChain(child, targetId, [expression, ...currentPath]);
        if (chain) return chain;
      }
    }
  }

  return null;
};

/**
 * Finds the immediate parent node of a given node ID.
 * @param expression - The filter expression to find parent in
 * @param targetId - The ID of the node whose parent to find
 * @returns The immediate parent node or null if not found or if the target is the root
 */
export const findImmediateParent = <P extends TFilterProperty>(
  expression: TFilterExpression<P>,
  targetId: string
): TFilterGroupNode<P> | null => {
  // if the expression is null, return null
  if (!expression) return null;

  // find the parent chain
  const parentChain = findParentChain(expression, targetId);

  // return the immediate parent if it exists
  return parentChain && parentChain.length > 0 ? parentChain[0] : null;
};

/**
 * Replaces a node in the expression tree with another node.
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
  if (expression.id === targetId) {
    return replacement;
  }

  if (expression.type === FILTER_NODE_TYPE.GROUP) {
    if (isNotGroupNode(expression)) {
      // For NOT groups, replace the single child
      return {
        ...expression,
        child:
          expression.child.id === targetId
            ? replacement
            : replaceNodeInExpression(expression.child, targetId, replacement),
      };
    } else if (isAndGroupNode(expression)) {
      // For AND groups, replace within the children array
      return {
        ...expression,
        children: expression.children.map((child) =>
          child.id === targetId ? replacement : replaceNodeInExpression(child, targetId, replacement)
        ),
      };
    } else if (isOrGroupNode(expression)) {
      // For OR groups, replace within the children array
      return {
        ...expression,
        children: expression.children.map((child) =>
          child.id === targetId ? replacement : replaceNodeInExpression(child, targetId, replacement)
        ),
      };
    } else {
      // This should never be reached with proper typing
      throw new Error("Unknown group type in replaceNodeInExpression");
    }
  }

  return expression;
};

/**
 * Extracts all conditions from a filter expression.
 * @param expression - The filter expression to extract conditions from
 * @returns An array of filter conditions
 */
export const extractConditions = <P extends TFilterProperty>(
  expression: TFilterExpression<P>
): TFilterConditionNode<P, TFilterValue>[] => {
  if (expression.type === FILTER_NODE_TYPE.CONDITION) {
    return [expression];
  }
  const children = getGroupChildren(expression);
  return children.flatMap((child) => extractConditions(child));
};

/**
 * Extracts all conditions from a filter expression, including their display operators (transformed based on NOT group context).
 * @param expression - The filter expression to extract conditions from
 * @returns An array of filter conditions with their display operators
 */
export const extractConditionsWithDisplayOperators = <P extends TFilterProperty>(
  expression: TFilterExpression<P>
): TFilterConditionNode<P, TFilterValue>[] => {
  // First extract all raw conditions
  const rawConditions = extractConditions(expression);

  // Transform operators based on immediate parent context
  return rawConditions.map((condition) => {
    const immediateParent = findImmediateParent(expression, condition.id);

    // If immediate parent is a NOT group, transform the operator
    if (immediateParent && isNotGroupNode(immediateParent)) {
      const displayOperator = getNegativeOperator(condition.operator);
      return {
        ...condition,
        operator: displayOperator,
      };
    }

    // Otherwise, return the condition as-is
    return condition;
  });
};
