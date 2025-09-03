import { v4 as uuidv4 } from "uuid";
// plane imports
import {
  FILTER_NODE_TYPE,
  IFilterAdapter,
  LOGICAL_OPERATOR,
  TExternalFilter,
  TFilterConditionNode,
  TFilterConditionPayload,
  TFilterExpression,
  TFilterGroupNode,
  TFilterAndGroupNode,
  TFilterOrGroupNode,
  TFilterNotGroupNode,
  TFilterProperty,
  TFilterValue,
  TLogicalOperator,
} from "@plane/types";
import { getGroupChildren } from "@plane/utils";

/**
 * Abstract base class for converting between external filter formats and internal filter expressions.
 * Provides common utilities for creating and manipulating filter nodes.
 *
 * @template K - Property key type that extends TFilterProperty
 * @template E - External filter type that extends TExternalFilter
 */
export abstract class FilterAdapter<K extends TFilterProperty, E extends TExternalFilter>
  implements IFilterAdapter<K, E>
{
  /**
   * Converts an external filter format to internal filter expression.
   * Must be implemented by concrete adapter classes.
   *
   * @param externalFilter - The external filter to convert
   * @returns The internal filter expression or null if conversion fails
   */
  abstract toInternal(externalFilter: E): TFilterExpression<K> | null;

  /**
   * Converts an internal filter expression to external filter format.
   * Must be implemented by concrete adapter classes.
   *
   * @param internalFilter - The internal filter expression to convert
   * @returns The external filter format
   */
  abstract toExternal(internalFilter: TFilterExpression<K> | null): E;

  /**
   * Extracts all conditions from a filter expression.
   * Recursively traverses group nodes to collect all leaf condition nodes.
   *
   * @param expression - The filter expression to extract conditions from
   * @returns An array of filter conditions
   */
  protected _extractConditions(expression: TFilterExpression<K>): TFilterConditionNode<K, TFilterValue>[] {
    if (expression.type === FILTER_NODE_TYPE.CONDITION) {
      return [expression];
    }
    // Handle both AND/OR groups (children array) and NOT groups (single child)
    const children = getGroupChildren(expression);
    return children.flatMap((child) => this._extractConditions(child));
  }

  /**
   * Creates a condition node with a unique ID.
   * Utility method for building filter condition nodes from payloads.
   *
   * @template V - Value type that extends TFilterValue
   * @param condition - The condition payload to create a node from
   * @returns The created condition node with generated ID
   */
  protected _createConditionNode = <V extends TFilterValue>(
    condition: TFilterConditionPayload<K, V>
  ): TFilterConditionNode<K, V> => ({
    id: uuidv4(),
    type: FILTER_NODE_TYPE.CONDITION,
    ...condition,
  });

  /**
   * Creates a group node with a unique ID.
   * Utility method for building filter group nodes that combine multiple conditions.
   *
   * @param operator - The logical operator to use for combining child nodes
   * @param nodes - The child nodes to add to the group
   * @returns The created group node with generated ID
   */
  protected _createGroupNode = (operator: TLogicalOperator, nodes: TFilterExpression<K>[]): TFilterGroupNode<K> => {
    if (operator === LOGICAL_OPERATOR.NOT) {
      if (nodes.length !== 1) {
        throw new Error("NOT groups must have exactly one child");
      }
      const notGroup: TFilterNotGroupNode<K> = {
        id: uuidv4(),
        type: FILTER_NODE_TYPE.GROUP,
        logicalOperator: operator,
        child: nodes[0],
      };
      return notGroup;
    }
    if (operator === LOGICAL_OPERATOR.AND) {
      const andGroup: TFilterAndGroupNode<K> = {
        id: uuidv4(),
        type: FILTER_NODE_TYPE.GROUP,
        logicalOperator: operator,
        children: nodes,
      };
      return andGroup;
    }
    if (operator === LOGICAL_OPERATOR.OR) {
      const orGroup: TFilterOrGroupNode<K> = {
        id: uuidv4(),
        type: FILTER_NODE_TYPE.GROUP,
        logicalOperator: operator,
        children: nodes,
      };
      return orGroup;
    }
    throw new Error(`Unknown logical operator: ${operator}`);
  };
}
