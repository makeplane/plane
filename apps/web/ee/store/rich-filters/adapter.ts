import { v4 as uuidv4 } from "uuid";
// plane imports
import {
  FILTER_NODE_TYPE,
  IFilterAdapter,
  TFilterConditionNode,
  TFilterConditionPayload,
  TFilterExpression,
  TFilterGroupNode,
  TLogicalOperator,
} from "@plane/types";

export abstract class FilterAdapter<FilterPropertyKey extends string, ExternalFilterType>
  implements IFilterAdapter<FilterPropertyKey, ExternalFilterType>
{
  abstract toInternal(externalFilter: ExternalFilterType): TFilterExpression<FilterPropertyKey> | null;
  abstract toExternal(internalFilter: TFilterExpression<FilterPropertyKey> | null): ExternalFilterType;

  /**
   * Extracts all conditions from a filter expression.
   * @param expression - The filter expression to extract conditions from.
   * @returns An array of filter conditions.
   */
  protected _extractConditions(
    expression: TFilterExpression<FilterPropertyKey>
  ): TFilterConditionNode<FilterPropertyKey>[] {
    if (expression.type === FILTER_NODE_TYPE.CONDITION) {
      return [expression];
    }
    return expression.children.flatMap((child) => this._extractConditions(child));
  }

  /**
   * Creates a condition node.
   * @param condition - The condition to create.
   * @returns The created condition node.
   */
  protected _createConditionNode = (
    condition: TFilterConditionPayload<FilterPropertyKey>
  ): TFilterConditionNode<FilterPropertyKey> => ({
    id: uuidv4(),
    type: FILTER_NODE_TYPE.CONDITION,
    ...condition,
  });

  /**
   * Creates a group node.
   * @param operator - The logical operator to use for the group.
   * @param nodes - The nodes to add to the group.
   * @returns The created group node.
   */
  protected _createGroupNode = (
    operator: TLogicalOperator,
    nodes: TFilterExpression<FilterPropertyKey>[]
  ): TFilterGroupNode<FilterPropertyKey> => ({
    id: uuidv4(),
    type: FILTER_NODE_TYPE.GROUP,
    logicalOperator: operator,
    children: nodes,
  });
}
