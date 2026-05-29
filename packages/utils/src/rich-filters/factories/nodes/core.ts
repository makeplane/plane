import { v4 as uuidv4 } from "uuid";
// plane imports
import type {
  TFilterAndGroupNode,
  TFilterConditionNode,
  TFilterConditionPayload,
  TFilterExpression,
  TFilterProperty,
  TFilterValue,
} from "@plane/types";
import { FILTER_NODE_TYPE, LOGICAL_OPERATOR } from "@plane/types";

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
