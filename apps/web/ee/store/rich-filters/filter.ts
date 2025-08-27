import { action, computed, makeObservable, observable } from "mobx";
import { computedFn } from "mobx-utils";
import { v4 as uuidv4 } from "uuid";
// plane imports
import { TExpressionOptions, TFilterOptions } from "@plane/constants";
import {
  FILTER_NODE_TYPE,
  IFilterAdapter,
  LOGICAL_OPERATOR,
  SingleOrArray,
  TAllOperators,
  TExternalFilter,
  TFilterConditionNode,
  TFilterConditionPayload,
  TFilterExpression,
  TFilterProperty,
  TFilterValue,
  TLogicalOperator,
} from "@plane/types";
// local imports
import { FilterConfigManager, IFilterConfigManager } from "./config-manager";
import { FilterInstanceHelper, IFilterInstanceHelper } from "./filter-helpers";
import {
  addAndCondition,
  addOrCondition,
  createConditionNode,
  extractConditions,
  extractConditionsWithDisplayOperators,
  findNodeById,
  getPositiveOperator,
  getValidOperatorsForCondition,
  isNegationOperator,
  removeNodeFromExpression,
  shouldNotifyChangeForExpression,
  shouldNotifyChangeForValue,
  updateNodeInExpression,
  wrapInNotGroup,
} from "@plane/utils";

/**
 * Interface for a filter instance.
 * Provides methods to manage the filter expression and notify changes.
 * - id: The id of the filter instance
 * - expression: The filter expression
 * - adapter: The filter adapter
 * - configManager: The filter config manager
 * - onExpressionChange: The callback to notify when the expression changes
 * - hasActiveFilters: Whether the filter instance has any active filters
 * - allConditions: All conditions in the filter expression
 * - allRawConditions: All raw conditions in the filter expression
 * - getValidOperatorsForCondition: The valid operators for a given condition
 * - addCondition: Adds a condition to the filter expression
 * - updateCondition: Updates a condition in the filter expression
 * - removeCondition: Removes a condition from the filter expression
 * - clearFilters: Clears the filter expression
 * @template K - The filter property type extending TFilterProperty
 * @template E - The external filter type extending TExternalFilter
 */
export interface IFilterInstance<K extends TFilterProperty, E extends TExternalFilter> {
  // observables
  id: string;
  expression: TFilterExpression<K> | null;
  adapter: IFilterAdapter<K, E>;
  configManager: IFilterConfigManager<K>;
  onExpressionChange?: (expression: E) => void;
  // computed
  hasActiveFilters: boolean;
  allConditions: TFilterConditionNode<K, TFilterValue>[];
  allRawConditions: TFilterConditionNode<K, TFilterValue>[];
  // computed functions
  getValidOperatorsForCondition: (conditionId: string, allOperators: readonly TAllOperators[]) => TAllOperators[];
  // filter condition
  addCondition: <V extends TFilterValue>(operator: TLogicalOperator, condition: TFilterConditionPayload<K, V>) => void;
  updateCondition: <V extends TFilterValue>(
    conditionId: string,
    updates: Partial<TFilterConditionPayload<K, V>>
  ) => void;
  removeCondition: (conditionId: string) => void;
  // cleanup
  clearFilters: () => void;
}

export type TFilterParams<K extends TFilterProperty, E extends TExternalFilter> = {
  adapter: IFilterAdapter<K, E>;
  options?: Partial<TFilterOptions>;
  initialExpression?: E;
  onExpressionChange?: (expression: E) => void;
};

export class FilterInstance<K extends TFilterProperty, E extends TExternalFilter> implements IFilterInstance<K, E> {
  // observables
  id: string;
  expression: TFilterExpression<K> | null;
  expressionOptions: TExpressionOptions;
  adapter: IFilterAdapter<K, E>;
  configManager: IFilterConfigManager<K>;
  onExpressionChange?: (expression: E) => void;

  // helper instance
  private helper: IFilterInstanceHelper<K, E>;

  constructor(params: TFilterParams<K, E>) {
    this.id = uuidv4();
    this.adapter = params.adapter;
    this.helper = new FilterInstanceHelper<K, E>(this.adapter);
    this.configManager = new FilterConfigManager<K, E>(this, {
      options: params.options?.config,
    });
    // initialize expression
    this.expression = this.helper.initializeExpression(params.initialExpression);
    this.expressionOptions = this.helper.initializeExpressionOptions();
    this.onExpressionChange = params.onExpressionChange;

    makeObservable(this, {
      // observables
      id: observable,
      expression: observable,
      expressionOptions: observable,
      adapter: observable,
      configManager: observable,
      // computed
      hasActiveFilters: computed,
      allConditions: computed,
      allRawConditions: computed,
      // actions
      addCondition: action,
      updateCondition: action,
      removeCondition: action,
      clearFilters: action,
    });
  }

  // ------------ computed ------------

  /**
   * Checks if the filter instance has any active filters.
   * @returns True if the filter instance has any active filters, false otherwise.
   */
  get hasActiveFilters(): IFilterInstance<K, E>["hasActiveFilters"] {
    return this.expression !== null;
  }

  /**
   * Returns all conditions from the filter expression.
   * @returns An array of filter conditions.
   */
  get allConditions(): IFilterInstance<K, E>["allConditions"] {
    if (!this.expression) return [];
    return extractConditionsWithDisplayOperators(this.expression);
  }

  /**
   * Returns all raw conditions from the filter expression (without display operator transformation).
   * This is useful for internal operations that need the actual stored operators.
   * @returns An array of raw filter conditions.
   */
  get allRawConditions(): IFilterInstance<K, E>["allRawConditions"] {
    if (!this.expression) return [];
    return extractConditions(this.expression);
  }

  // ------------ computed functions ------------

  /**
   * Returns the valid operators for a given condition based on its value.
   * This is useful for dynamically changing operators based on the value entered.
   * @param conditionId - The id of the condition to get operators for.
   * @param allOperators - The full list of available operators.
   * @returns An array of operators that are valid for the given condition.
   */
  getValidOperatorsForCondition: IFilterInstance<K, E>["getValidOperatorsForCondition"] = computedFn(
    (conditionId, allOperators) => {
      if (!this.expression) return [...allOperators];
      const condition = findNodeById(this.expression, conditionId);
      if (!condition || condition.type !== FILTER_NODE_TYPE.CONDITION) {
        return [...allOperators];
      }
      return getValidOperatorsForCondition(condition, allOperators);
    }
  );

  // ------------ actions ------------

  /**
   * Adds a condition to the filter expression.
   * @param operator - The logical operator to use for the condition.
   * @param condition - The condition to add.
   */
  addCondition: IFilterInstance<K, E>["addCondition"] = action((operator, condition) => {
    // Handle negation operators by converting to positive and wrapping in NOT group
    let finalCondition = condition;
    let conditionToAdd: TFilterExpression<K>;
    const conditionValue = condition.value;

    if (isNegationOperator(condition.operator)) {
      // Convert negation operator to positive
      const positiveOperator = getPositiveOperator(condition.operator);
      finalCondition = {
        ...condition,
        operator: positiveOperator,
      };

      // Create condition node and wrap in NOT group
      const conditionNode = createConditionNode(finalCondition);
      conditionToAdd = wrapInNotGroup(conditionNode);
    } else {
      // Create condition node directly
      conditionToAdd = createConditionNode(finalCondition);
    }

    switch (operator) {
      case LOGICAL_OPERATOR.AND:
        this.expression = addAndCondition(this.expression, conditionToAdd);
        break;
      case LOGICAL_OPERATOR.OR:
        this.expression = addOrCondition(this.expression, conditionToAdd);
        break;
    }

    if (shouldNotifyChangeForValue(conditionValue)) {
      this._notifyExpressionChange();
    }
  });

  /**
   * Updates a condition in the filter expression.
   * @param conditionId - The id of the condition to update.
   * @param updates - The updates to apply to the condition.
   */
  updateCondition: IFilterInstance<K, E>["updateCondition"] = action(
    <V extends TFilterValue>(conditionId: string, updates: Partial<TFilterConditionPayload<K, V>>) => {
      if (!this.expression) return;

      // Track if this is an automatic optimization vs user-initiated operator change
      let isAutomaticOptimization = false;

      // If value is being updated, check if operator and value need to be adjusted
      if (updates.value !== undefined) {
        // Get the current condition to determine its current operator
        const currentCondition = findNodeById(this.expression, conditionId);
        if (currentCondition && currentCondition.type === FILTER_NODE_TYPE.CONDITION) {
          const currentOperator = currentCondition.operator;
          const { operator: optimalOperator, value: transformedValue } = this.helper.getOptimalOperatorForValue(
            currentOperator,
            updates.value,
            this.expression,
            conditionId
          );

          // If operator or value needs to change, include them in the updates
          if (optimalOperator !== currentOperator) {
            updates = { ...updates, operator: optimalOperator, value: transformedValue as SingleOrArray<V> };
            isAutomaticOptimization = true;
          } else if (transformedValue !== updates.value) {
            // Only value transformation needed
            updates = { ...updates, value: transformedValue as SingleOrArray<V> };
          }
        }
      }

      // Check if operator is being updated and handle appropriately
      if (updates.operator !== undefined && isAutomaticOptimization === false) {
        // User-initiated operator change - use restructuring logic
        const updatedExpression = this.helper.restructureExpressionForOperatorChange<V>(
          this.expression,
          conditionId,
          updates.operator,
          updates
        );
        if (updatedExpression) {
          this.expression = updatedExpression;
        }
      } else {
        // No operator change, just update the condition normally
        updateNodeInExpression(this.expression, conditionId, updates);
      }

      this._notifyExpressionChange();
    }
  );

  /**
   * Removes a condition from the filter expression.
   * @param conditionId - The id of the condition to remove.
   */
  removeCondition: IFilterInstance<K, E>["removeCondition"] = action((conditionId) => {
    if (!this.expression) return;
    const { expression, shouldNotify } = removeNodeFromExpression(this.expression, conditionId);
    this.expression = expression;
    if (shouldNotify) {
      this._notifyExpressionChange();
    }
  });

  /**
   * Clears the filter expression.
   */
  clearFilters: IFilterInstance<K, E>["clearFilters"] = action(() => {
    const shouldNotify = shouldNotifyChangeForExpression(this.expression);
    this.expression = null;
    if (shouldNotify) {
      this._notifyExpressionChange();
    }
  });

  // ------------ private helpers ------------

  /**
   * Notifies the parent component of the expression change.
   */
  private _notifyExpressionChange(): void {
    this.onExpressionChange?.(this.adapter.toExternal(this.expression));
  }
}
