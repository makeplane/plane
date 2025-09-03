import { v4 as uuidv4 } from "uuid";
// plane imports
import {
  FILTER_NODE_TYPE,
  LOGICAL_OPERATOR,
  TFilterAndGroupNode,
  TFilterConditionNode,
  TFilterConditionPayload,
  TFilterExpression,
  TFilterNotGroupNode,
  TFilterOrGroupNode,
  TFilterProperty,
  TFilterValue,
} from "@plane/types";

/**
 * Creates a condition node with a unique ID.
 * @param condition - The condition to create
 * @returns The created condition node
 */
export const createConditionNode = <P extends TFilterProperty, V extends TFilterValue>(
  condition: TFilterConditionPayload<P, V>
): TFilterConditionNode<P, V> => ({
  id: uuidv4(),
  type: FILTER_NODE_TYPE.CONDITION,
  ...condition,
});

/**
 * Creates a NOT group node with a unique ID.
 * @param node - The single node to negate
 * @returns The created NOT group node
 */
export const createNotGroupNode = <P extends TFilterProperty>(node: TFilterExpression<P>): TFilterNotGroupNode<P> => ({
  id: uuidv4(),
  type: FILTER_NODE_TYPE.GROUP,
  logicalOperator: LOGICAL_OPERATOR.NOT,
  child: node,
});

/**
 * Creates an AND group node with a unique ID.
 * @param nodes - The nodes to add to the group
 * @returns The created AND group node
 */
export const createAndGroupNode = <P extends TFilterProperty>(
  nodes: TFilterExpression<P>[]
): TFilterAndGroupNode<P> => ({
  id: uuidv4(),
  type: FILTER_NODE_TYPE.GROUP,
  logicalOperator: LOGICAL_OPERATOR.AND,
  children: nodes,
});

/**
 * Creates an OR group node with a unique ID.
 * @param nodes - The nodes to add to the group
 * @returns The created OR group node
 */
export const createOrGroupNode = <P extends TFilterProperty>(nodes: TFilterExpression<P>[]): TFilterOrGroupNode<P> => ({
  id: uuidv4(),
  type: FILTER_NODE_TYPE.GROUP,
  logicalOperator: LOGICAL_OPERATOR.OR,
  children: nodes,
});
