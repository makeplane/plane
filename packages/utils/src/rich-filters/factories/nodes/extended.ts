import { v4 as uuidv4 } from "uuid";
// plane imports
import {
  FILTER_NODE_TYPE,
  LOGICAL_OPERATOR,
  TFilterConditionNode,
  TFilterExpression,
  TFilterNotGroupNode,
  TFilterOrGroupNode,
  TFilterProperty,
  TFilterValue,
} from "@plane/types";

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

/**
 * Wraps a condition node in a NOT group.
 * @param conditionNode - The condition node to wrap
 * @returns A NOT group containing the condition
 */
export const wrapInNotGroup = <P extends TFilterProperty>(conditionNode: TFilterConditionNode<P, TFilterValue>) =>
  createNotGroupNode(conditionNode);
