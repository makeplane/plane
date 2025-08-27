// plane imports
import { DEFAULT_FILTER_EXPRESSION_OPTIONS, TExpressionOptions } from "@plane/constants";
import {
  IFilterAdapter,
  TAllOperators,
  TFilterConditionNode,
  TFilterConditionPayload,
  TFilterExpression,
  TFilterValue,
  TFilterProperty,
  TExternalFilter,
  SingleOrArray,
} from "@plane/types";
import {
  downgradeOperator,
  findNodeById,
  getNegativeOperator,
  getPositiveOperator,
  isDirectlyWrappedInNotGroup,
  isNegationOperator,
  replaceNodeInExpression,
  shouldDowngradeOperator,
  shouldUpgradeOperator,
  transformValueForOperator,
  unwrapFromNotGroup,
  updateNodeInExpression,
  upgradeOperator,
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
  initializeExpressionOptions: (expressionOptions?: Partial<TExpressionOptions>) => TExpressionOptions;

  getOptimalOperatorForValue: (
    currentOperator: TAllOperators,
    value: SingleOrArray<TFilterValue>,
    expression?: TFilterExpression<P>,
    conditionId?: string
  ) => {
    operator: TAllOperators;
    value: SingleOrArray<TFilterValue>;
  };

  // group operations
  restructureExpressionForOperatorChange: <V extends TFilterValue>(
    expression: TFilterExpression<P> | null,
    conditionId: string,
    newOperator: TAllOperators,
    condition: Partial<TFilterConditionPayload<P, V>>
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
    return this.adapter.toInternal(initialExpression);
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

  // ------------ operator utilities ------------

  /**
   * Gets the optimal operator and transformed value for a given value, automatically upgrading or downgrading as needed.
   * @param currentOperator - The current operator
   * @param value - The filter value
   * @param expression - The full expression to check for NOT group context
   * @param conditionId - The condition ID to check for NOT group context
   * @returns An object containing the optimal operator and transformed value
   */
  getOptimalOperatorForValue: IFilterInstanceHelper<P, E>["getOptimalOperatorForValue"] = (
    currentOperator,
    value,
    expression,
    conditionId
  ) => {
    const valueCount = Array.isArray(value) ? value.length : value !== null && value !== undefined ? 1 : 0;

    // Determine if condition is in NOT group context
    const isInNotGroup = expression && conditionId ? isDirectlyWrappedInNotGroup(expression, conditionId) : false;

    // Get the display operator (considering NOT group context)
    const displayOperator = isInNotGroup ? getNegativeOperator(currentOperator) : currentOperator;

    // Check if display operator needs upgrade/downgrade
    let optimalDisplayOperator = displayOperator;

    if (shouldUpgradeOperator(displayOperator, valueCount)) {
      optimalDisplayOperator = upgradeOperator(displayOperator);
    } else if (shouldDowngradeOperator(displayOperator, valueCount)) {
      optimalDisplayOperator = downgradeOperator(displayOperator);
    }

    // If no change needed, return current operator and value
    if (optimalDisplayOperator === displayOperator) {
      return {
        operator: currentOperator,
        value: value,
      };
    }

    // Convert back to raw operator based on NOT group context
    const finalOperator = isInNotGroup ? getPositiveOperator(optimalDisplayOperator) : optimalDisplayOperator;

    // Transform value for the new operator
    const transformedValue = transformValueForOperator(value, displayOperator, optimalDisplayOperator);

    return {
      operator: finalOperator,
      value: transformedValue,
    };
  };

  // ------------ group operations ------------

  /**
   * Restructures the expression when a condition's operator changes between positive and negative.
   * @param expression - The filter expression to operate on
   * @param conditionId - The ID of the condition being updated
   * @param newOperator - The new operator for the condition
   * @param condition - The condition payload with the new operator
   * @returns The restructured expression
   */
  restructureExpressionForOperatorChange: IFilterInstanceHelper<P, E>["restructureExpressionForOperatorChange"] = (
    expression,
    conditionId,
    newOperator,
    condition
  ) => {
    if (!expression) return null;

    const isNewOperatorNegation = isNegationOperator(newOperator);
    const isCurrentlyWrapped = isDirectlyWrappedInNotGroup(expression, conditionId);

    if (isNewOperatorNegation && !isCurrentlyWrapped) {
      // Convert negation operator to positive and wrap in NOT group
      const positiveOperator = getPositiveOperator(newOperator);
      const updatedCondition: Partial<TFilterConditionPayload<P, TFilterValue>> = {
        ...condition,
        operator: positiveOperator,
      };

      // Update the condition with positive operator
      updateNodeInExpression(expression, conditionId, updatedCondition);

      // Find the updated condition node and wrap it in NOT group
      const conditionNode = findNodeById(expression, conditionId) as TFilterConditionNode<P, TFilterValue>;
      if (conditionNode) {
        const notGroup = wrapInNotGroup(conditionNode);
        return replaceNodeInExpression(expression, conditionId, notGroup);
      }
    } else if (!isNewOperatorNegation && isCurrentlyWrapped) {
      // Unwrap from NOT group and use positive operator directly
      const updatedCondition: Partial<TFilterConditionPayload<P, TFilterValue>> = {
        ...condition,
        operator: newOperator,
      };

      // Update the condition first
      updateNodeInExpression(expression, conditionId, updatedCondition);

      // Then unwrap from NOT group
      return unwrapFromNotGroup(expression, conditionId);
    } else {
      // No restructuring needed, just update the operator
      const finalOperator = isNewOperatorNegation ? getPositiveOperator(newOperator) : newOperator;
      const updatedCondition: Partial<TFilterConditionPayload<P, TFilterValue>> = {
        ...condition,
        operator: finalOperator,
      };

      updateNodeInExpression(expression, conditionId, updatedCondition);
      return expression;
    }

    return expression;
  };
}
