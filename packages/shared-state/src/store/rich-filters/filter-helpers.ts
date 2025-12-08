import { cloneDeep } from "lodash-es";
import { action, makeObservable, observable, toJS } from "mobx";
// plane imports
import type { TAutoVisibilityOptions, TExpressionOptions } from "@plane/constants";
import { DEFAULT_FILTER_EXPRESSION_OPTIONS } from "@plane/constants";
import type {
  IFilterAdapter,
  TSupportedOperators,
  TFilterConditionNode,
  TFilterExpression,
  TFilterValue,
  TFilterProperty,
  TExternalFilter,
  TLogicalOperator,
  TFilterConditionPayload,
} from "@plane/types";
import { LOGICAL_OPERATOR } from "@plane/types";
import { addAndCondition, createConditionNode, updateNodeInExpression } from "@plane/utils";
// local imports
import type { IFilterInstance } from "./filter";

type TFilterInstanceHelperParams<P extends TFilterProperty, E extends TExternalFilter> = {
  adapter: IFilterAdapter<P, E>;
};

/**
 * Interface for filter instance helper utilities.
 * Provides comprehensive methods for filter expression manipulation, node operations,
 * operator utilities, and expression restructuring.
 * @template P - The filter property type extending TFilterProperty
 * @template E - The external filter type extending TExternalFilter
 */
export interface IFilterInstanceHelper<P extends TFilterProperty, E extends TExternalFilter> {
  isVisible: boolean;
  // initialization
  initializeExpression: (initialExpression?: E) => TFilterExpression<P> | null;
  initializeExpressionOptions: (expressionOptions?: Partial<TExpressionOptions<E>>) => TExpressionOptions<E>;
  // visibility
  setInitialVisibility: (visibilityOption: TAutoVisibilityOptions) => void;
  toggleVisibility: (isVisible?: boolean) => void;
  // condition operations
  addConditionToExpression: <V extends TFilterValue>(
    expression: TFilterExpression<P> | null,
    groupOperator: TLogicalOperator,
    condition: TFilterConditionPayload<P, V>,
    isNegation: boolean
  ) => TFilterExpression<P> | null;
  handleConditionPropertyUpdate: (
    expression: TFilterExpression<P>,
    conditionId: string,
    property: P,
    operator: TSupportedOperators,
    isNegation: boolean
  ) => TFilterExpression<P> | null;
  // group operations
  restructureExpressionForOperatorChange: (
    expression: TFilterExpression<P>,
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
export class FilterInstanceHelper<
  P extends TFilterProperty,
  E extends TExternalFilter,
> implements IFilterInstanceHelper<P, E> {
  // parent filter instance
  private _filterInstance: IFilterInstance<P, E>;
  // adapter
  private adapter: IFilterAdapter<P, E>;
  // visibility
  isVisible: boolean;

  /**
   * Creates a new FilterInstanceHelper instance.
   *
   * @param adapter - The filter adapter for converting between internal and external formats
   */
  constructor(filterInstance: IFilterInstance<P, E>, params: TFilterInstanceHelperParams<P, E>) {
    this._filterInstance = filterInstance;
    this.adapter = params.adapter;
    this.isVisible = false;

    makeObservable(this, {
      isVisible: observable,
      setInitialVisibility: action,
      toggleVisibility: action,
    });
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

  /**
   * Sets the initial visibility state for the filter based on options and active filters.
   * @param visibilityOption - The visibility options for the filter instance.
   * @returns The initial visibility state
   */
  setInitialVisibility: IFilterInstanceHelper<P, E>["setInitialVisibility"] = action((visibilityOption) => {
    // If explicit initial visibility is provided, use it
    if (visibilityOption.autoSetVisibility === false) {
      this.isVisible = visibilityOption.isVisibleOnMount;
      return;
    }

    // If filter has active filters, make it visible
    if (this._filterInstance.hasActiveFilters) {
      this.isVisible = true;
      return;
    }

    // Default to hidden if no active filters
    this.isVisible = false;
    return;
  });

  /**
   * Toggles the visibility of the filter.
   * @param isVisible - The visibility to set.
   */
  toggleVisibility: IFilterInstanceHelper<P, E>["toggleVisibility"] = action((isVisible) => {
    if (isVisible !== undefined) {
      this.isVisible = isVisible;
      return;
    }
    this.isVisible = !this.isVisible;
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

  /**
   * Updates the property and operator of a condition in the filter expression.
   * This method updates the property, operator, resets the value, and handles negation properly.
   * @param expression - The filter expression to operate on
   * @param conditionId - The ID of the condition being updated
   * @param property - The new property for the condition
   * @param operator - The new operator for the condition
   * @param isNegation - Whether the condition should be negated
   * @returns The updated expression
   */
  handleConditionPropertyUpdate: IFilterInstanceHelper<P, E>["handleConditionPropertyUpdate"] = (
    expression,
    conditionId,
    property,
    operator,
    isNegation
  ) => {
    const payload = { property, operator, value: undefined };

    return this._updateCondition(expression, conditionId, payload, isNegation);
  };

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
    const payload = shouldResetValue ? { operator: newOperator, value: undefined } : { operator: newOperator };

    return this._updateCondition(expression, conditionId, payload, isNegation);
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
    _isNegation: boolean
  ): TFilterExpression<P> => {
    const conditionNode = createConditionNode(condition);

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
      default:
        console.warn(`Unsupported logical operator: ${groupOperator}`);
        return expression;
    }
  }

  /**
   * Updates a condition with the given payload and handles negation wrapping/unwrapping.
   * @param expression - The filter expression to operate on
   * @param conditionId - The ID of the condition being updated
   * @param payload - The payload to update the condition with
   * @param isNegation - Whether the condition should be negated
   * @returns The updated expression with proper negation handling
   */
  private _updateCondition = (
    expression: TFilterExpression<P>,
    conditionId: string,
    payload: Partial<TFilterConditionNode<P, TFilterValue>>,
    _isNegation: boolean
  ): TFilterExpression<P> | null => {
    // Update the condition with the payload
    updateNodeInExpression(expression, conditionId, payload);

    return expression;
  };
}
