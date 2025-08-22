import { action, computed, makeObservable, observable } from "mobx";
import { computedFn } from "mobx-utils";
import { v4 as uuidv4 } from "uuid";
// plane imports
import { TExpressionOptions, TFilterOptions } from "@plane/constants";
import {
  FILTER_NODE_TYPE,
  IFilterAdapter,
  LOGICAL_OPERATOR,
  TAllOperators,
  TFilterConditionNode,
  TFilterConditionPayload,
  TFilterExpression,
  TLogicalOperator,
} from "@plane/types";
// local imports
import { FilterConfigManager, IFilterConfigManager } from "./config-manager";
import { FilterInstanceHelper, IFilterInstanceHelper } from "./filter-helpers";

export interface IFilterInstance<FilterPropertyKey extends string, TExternalFilterType> {
  // observables
  id: string;
  expression: TFilterExpression<FilterPropertyKey> | null;
  adapter: IFilterAdapter<FilterPropertyKey, TExternalFilterType>;
  configManager: IFilterConfigManager<FilterPropertyKey>;
  onExpressionChange?: (expression: TExternalFilterType) => void;
  // computed
  hasActiveFilters: boolean;
  allConditions: TFilterConditionNode<FilterPropertyKey>[];
  allRawConditions: TFilterConditionNode<FilterPropertyKey>[];
  // computed functions
  isConditionNegated: (conditionId: string) => boolean;
  getValidOperatorsForCondition: (conditionId: string, allOperators: readonly TAllOperators[]) => TAllOperators[];
  // filter condition
  addCondition: (operator: TLogicalOperator, condition: TFilterConditionPayload<FilterPropertyKey>) => void;
  updateCondition: (conditionId: string, updates: Partial<TFilterConditionPayload<FilterPropertyKey>>) => void;
  removeCondition: (conditionId: string) => void;
  // filter group
  // createGroup: (nodeIds: string[], operator: ELogicalOperator) => void;
  // changeGroupOperator: (groupId: string, operator: ELogicalOperator) => void;
  // setExpression: (expression: TFilterExpression | null) => void;
  // cleanup
  clearFilters: () => void;
}

export type TFilterParams<FilterPropertyKey extends string, TExternalFilterType> = {
  adapter: IFilterAdapter<FilterPropertyKey, TExternalFilterType>;
  options?: Partial<TFilterOptions>;
  initialExpression?: TExternalFilterType;
  onExpressionChange?: (expression: TExternalFilterType) => void;
};

export class FilterInstance<FilterPropertyKey extends string, TExternalFilterType>
  implements IFilterInstance<FilterPropertyKey, TExternalFilterType>
{
  // observables
  id: string;
  expression: TFilterExpression<FilterPropertyKey> | null;
  expressionOptions: TExpressionOptions;
  adapter: IFilterAdapter<FilterPropertyKey, TExternalFilterType>;
  configManager: IFilterConfigManager<FilterPropertyKey>;
  onExpressionChange?: (expression: TExternalFilterType) => void;

  // helper instance
  private helper: IFilterInstanceHelper<FilterPropertyKey, TExternalFilterType>;

  constructor(params: TFilterParams<FilterPropertyKey, TExternalFilterType>) {
    this.id = uuidv4();
    this.adapter = params.adapter;
    this.helper = new FilterInstanceHelper<FilterPropertyKey, TExternalFilterType>(this.adapter);
    this.configManager = new FilterConfigManager<FilterPropertyKey, TExternalFilterType>(this, {
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
      // createGroup: action,
      // changeGroupOperator: action,
      // setExpression: action,
      clearFilters: action,
    });
  }

  // ------------ computed ------------

  /**
   * Checks if the filter instance has any active filters.
   * @returns True if the filter instance has any active filters, false otherwise.
   */
  get hasActiveFilters(): boolean {
    return this.expression !== null;
  }

  /**
   * Returns all conditions from the filter expression.
   * @returns An array of filter conditions.
   */
  get allConditions(): TFilterConditionNode<FilterPropertyKey>[] {
    if (!this.expression) return [];
    return this.helper.extractConditionsWithDisplayOperators(this.expression);
  }

  /**
   * Returns all raw conditions from the filter expression (without display operator transformation).
   * This is useful for internal operations that need the actual stored operators.
   * @returns An array of raw filter conditions.
   */
  get allRawConditions(): TFilterConditionNode<FilterPropertyKey>[] {
    if (!this.expression) return [];
    return this.helper.extractConditions(this.expression);
  }

  // ------------ computed functions ------------

  /**
   * Checks if a condition is negated by its parent group.
   * @param conditionId - The id of the condition to check.
   * @returns True if the condition is negated, false otherwise.
   */
  isConditionNegated = computedFn((conditionId: string): boolean => {
    if (!this.expression) return false;
    return this.helper.isDirectlyWrappedInNotGroup(this.expression, conditionId);
  });

  /**
   * Returns the valid operators for a given condition based on its value.
   * This is useful for dynamically changing operators based on the value entered.
   * @param conditionId - The id of the condition to get operators for.
   * @param allOperators - The full list of available operators.
   * @returns An array of operators that are valid for the given condition.
   */
  getValidOperatorsForCondition = computedFn(
    (conditionId: string, allOperators: readonly TAllOperators[]): TAllOperators[] => {
      if (!this.expression) return [...allOperators];
      const condition = this.helper.findNodeById(this.expression, conditionId);
      if (!condition || condition.type !== FILTER_NODE_TYPE.CONDITION) {
        return [...allOperators];
      }
      return this.helper.getValidOperatorsForCondition(condition, allOperators);
    }
  );

  // ------------ actions ------------

  /**
   * Adds a condition to the filter expression.
   * @param operator - The logical operator to use for the condition.
   * @param condition - The condition to add.
   */
  addCondition = action((operator: TLogicalOperator, condition: TFilterConditionPayload<FilterPropertyKey>): void => {
    // Handle negation operators by converting to positive and wrapping in NOT group
    let finalCondition = condition;
    let conditionToAdd: TFilterExpression<FilterPropertyKey>;
    const conditionValue = condition.value;

    if (this.helper.isNegationOperator(condition.operator)) {
      // Convert negation operator to positive
      const positiveOperator = this.helper.getPositiveOperator(condition.operator);
      finalCondition = {
        ...condition,
        operator: positiveOperator,
      };

      // Create condition node and wrap in NOT group
      const conditionNode = this.helper.createConditionNode(finalCondition);
      conditionToAdd = this.helper.wrapInNotGroup(conditionNode);
    } else {
      // Create condition node directly
      conditionToAdd = this.helper.createConditionNode(finalCondition);
    }

    switch (operator) {
      case LOGICAL_OPERATOR.AND:
        this.expression = this.helper.addAndCondition(this.expression, conditionToAdd);
        break;
      case LOGICAL_OPERATOR.OR:
        this.expression = this.helper.addOrCondition(this.expression, conditionToAdd);
        break;
    }

    if (this.helper.shouldNotifyChangeForValue(conditionValue)) {
      this._notifyExpressionChange();
    }
  });

  /**
   * Updates a condition in the filter expression.
   * @param conditionId - The id of the condition to update.
   * @param updates - The updates to apply to the condition.
   */
  updateCondition = action(
    (conditionId: string, updates: Partial<TFilterConditionPayload<FilterPropertyKey>>): void => {
      if (!this.expression) return;

      // Track if this is an automatic optimization vs user-initiated operator change
      let isAutomaticOptimization = false;

      // If value is being updated, check if operator needs to be adjusted
      if (updates.value !== undefined) {
        // Get the current condition to determine its current operator
        const currentCondition = this.helper.findNodeById(this.expression, conditionId);
        if (currentCondition && currentCondition.type === FILTER_NODE_TYPE.CONDITION) {
          const currentOperator = currentCondition.operator;
          const optimalOperator = this.helper.getOptimalOperatorForValue(
            currentOperator,
            updates.value,
            this.expression,
            conditionId
          );

          // If operator needs to change, include it in the updates
          if (optimalOperator !== currentOperator) {
            updates = { ...updates, operator: optimalOperator };
            isAutomaticOptimization = true;
          }
        }
      }

      // Check if operator is being updated and handle appropriately
      if (updates.operator !== undefined && isAutomaticOptimization === false) {
        // User-initiated operator change - use restructuring logic
        const updatedExpression = this.helper.restructureExpressionForOperatorChange(
          this.expression,
          conditionId,
          updates.operator,
          updates as TFilterConditionPayload<FilterPropertyKey>
        );
        if (updatedExpression) {
          this.expression = updatedExpression;
        }
      } else {
        // No operator change, just update the condition normally
        this.helper.updateNodeInExpression(this.expression, conditionId, updates);
      }

      this._notifyExpressionChange();
    }
  );

  /**
   * Removes a condition from the filter expression.
   * @param conditionId - The id of the condition to remove.
   */
  removeCondition = action((conditionId: string): void => {
    if (!this.expression) return;
    const { expression, shouldNotify } = this.helper.removeNodeFromExpression(this.expression, conditionId);
    this.expression = expression;
    if (shouldNotify) {
      this._notifyExpressionChange();
    }
  });

  /**
   * Clears the filter expression.
   */
  clearFilters = action((): void => {
    const shouldNotify = this.helper.shouldNotifyChangeForExpression(this.expression);
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
