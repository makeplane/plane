import { cloneDeep } from "lodash-es";
import { toJS } from "mobx";
// plane imports
import { DEFAULT_FILTER_EXPRESSION_OPTIONS, TExpressionOptions } from "@plane/constants";
import {
  IFilterAdapter,
  LOGICAL_OPERATOR,
  TSupportedOperators,
  TFilterConditionNode,
  TFilterExpression,
  TFilterValue,
  TFilterProperty,
  TExternalFilter,
  TLogicalOperator,
  TFilterConditionPayload,
} from "@plane/types";
import {
  addAndCondition,
  addOrCondition,
  createConditionNode,
  findNodeById,
  isDirectlyWrappedInNotGroup,
  replaceNodeInExpression,
  unwrapFromNotGroup,
  updateNodeInExpression,
  wrapInNotGroup,
} from "@plane/utils";

/**
 * Interface for filter instance helper utilities.
 * Provides comprehensive methods for filter expression manipulation, node operations,
 * operator utilities, and expression restructuring.
 * @template P - The filter property type extending TFilterProperty
 * @template E - The external filter type extending TExternalFilter
 */
export interface IFilterInstanceHelper<P extends TFilterProperty, E extends TExternalFilter> {
  // initialization
  initializeExpression: (initialExpression?: E) => TFilterExpression<P> | null;
  initializeExpressionOptions: (expressionOptions?: Partial<TExpressionOptions<E>>) => TExpressionOptions<E>;
  // condition operations
  addConditionToExpression: <V extends TFilterValue>(
    expression: TFilterExpression<P> | null,
    groupOperator: TLogicalOperator,
    condition: TFilterConditionPayload<P, V>,
    isNegation: boolean
  ) => TFilterExpression<P> | null;
  // group operations
  restructureExpressionForOperatorChange: (
    expression: TFilterExpression<P> | null,
    conditionId: string,
    newOperator: TSupportedOperators,
    isNegation: boolean,
    shouldResetValue: boolean
  ) => TFilterExpression<P> | null;
}

/**
 * Comprehensive helper class for filter instance operations.
 * Provides utilities for filter expression manipulation, node operations,
 * operator transformations, and expression restructuring.
 *
 * @template K - The filter property type extending TFilterProperty
 * @template E - The external filter type extending TExternalFilter
 */
export class FilterInstanceHelper<P extends TFilterProperty, E extends TExternalFilter>
  implements IFilterInstanceHelper<P, E>
{
  private adapter: IFilterAdapter<P, E>;

  /**
   * Creates a new FilterInstanceHelper instance.
   *
   * @param adapter - The filter adapter for converting between internal and external formats
   */
  constructor(adapter: IFilterAdapter<P, E>) {
    this.adapter = adapter;
  }

  // ------------ initialization ------------

  /**
   * Initializes the filter expression from external format.
   * @param initialExpression - The initial expression to initialize the filter with
   * @returns The initialized filter expression or null if no initial expression provided
   */
  initializeExpression: IFilterInstanceHelper<P, E>["initializeExpression"] = (initialExpression) => {
    if (!initialExpression) return null;
    return this.adapter.toInternal(toJS(cloneDeep(initialExpression)));
  };

  /**
   * Initializes the filter expression options with defaults.
   * @param expressionOptions - Optional expression options to override defaults
   * @returns The initialized filter expression options
   */
  initializeExpressionOptions: IFilterInstanceHelper<P, E>["initializeExpressionOptions"] = (expressionOptions) => ({
    ...DEFAULT_FILTER_EXPRESSION_OPTIONS,
    ...expressionOptions,
  });

  // ------------ condition operations ------------

  /**
   * Adds a condition to the filter expression based on the logical operator.
   * @param expression - The current filter expression
   * @param groupOperator - The logical operator to use for the condition
   * @param condition - The condition to add
   * @param isNegation - Whether the condition should be negated
   * @returns The updated filter expression
   */
  addConditionToExpression: IFilterInstanceHelper<P, E>["addConditionToExpression"] = (
    expression,
    groupOperator,
    condition,
    isNegation
  ) => this._addConditionByOperator(expression, groupOperator, this._getConditionPayloadToAdd(condition, isNegation));

  // ------------ group operations ------------

  /**
   * Restructures the expression when a condition's operator changes between positive and negative.
   * @param expression - The filter expression to operate on
   * @param conditionId - The ID of the condition being updated
   * @param newOperator - The new operator for the condition
   * @param isNegation - Whether the operator is negation
   * @param shouldResetValue - Whether to reset the condition value
   * @returns The restructured expression
   */
  restructureExpressionForOperatorChange: IFilterInstanceHelper<P, E>["restructureExpressionForOperatorChange"] = (
    expression,
    conditionId,
    newOperator,
    isNegation,
    shouldResetValue
  ) => {
    if (!expression) return null;

    const payload = shouldResetValue ? { operator: newOperator, value: undefined } : { operator: newOperator };

    // Update the condition with the new operator
    updateNodeInExpression(expression, conditionId, payload);

    const isWrappedInNotGroup = isDirectlyWrappedInNotGroup(expression, conditionId);

    if (isNegation && !isWrappedInNotGroup) {
      const conditionNode = findNodeById(expression, conditionId) as TFilterConditionNode<P, TFilterValue>;
      const notGroup = wrapInNotGroup(conditionNode);
      return replaceNodeInExpression(expression, conditionId, notGroup);
    }

    if (!isNegation && isWrappedInNotGroup) {
      return unwrapFromNotGroup(expression, conditionId);
    }

    return expression;
  };

  // ------------ private helpers ------------

  /**
   * Gets the condition payload to add to the expression.
   * @param conditionNode - The condition node to add
   * @param isNegation - Whether the condition should be negated
   * @returns The condition payload to add
   */
  private _getConditionPayloadToAdd = (
    condition: TFilterConditionPayload<P, TFilterValue>,
    isNegation: boolean
  ): TFilterExpression<P> => {
    const conditionNode = createConditionNode(condition);

    // Wrap the condition in a NOT group if it is negation
    if (isNegation) {
      return wrapInNotGroup(conditionNode);
    }

    return conditionNode;
  };

  /**
   * Handles the logical operator switch for adding conditions.
   * @param expression - The current expression
   * @param groupOperator - The logical operator
   * @param conditionToAdd - The condition to add
   * @returns The updated expression
   */
  private _addConditionByOperator(
    expression: TFilterExpression<P> | null,
    groupOperator: TLogicalOperator,
    conditionToAdd: TFilterExpression<P>
  ): TFilterExpression<P> | null {
    switch (groupOperator) {
      case LOGICAL_OPERATOR.AND:
        return addAndCondition(expression, conditionToAdd);
      case LOGICAL_OPERATOR.OR:
        return addOrCondition(expression, conditionToAdd);
      default:
        console.warn(`Unsupported logical operator: ${groupOperator}`);
        return expression;
    }
  }
}
