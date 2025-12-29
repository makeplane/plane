import { cloneDeep, isEqual } from "lodash-es";
import { action, computed, makeObservable, observable, toJS } from "mobx";
import { computedFn } from "mobx-utils";
import { v4 as uuidv4 } from "uuid";
// plane imports
import type {
  TClearFilterOptions,
  TExpressionOptions,
  TFilterOptions,
  TSaveViewOptions,
  TUpdateViewOptions,
} from "@plane/constants";
import { DEFAULT_FILTER_VISIBILITY_OPTIONS } from "@plane/constants";
import type {
  IFilterAdapter,
  SingleOrArray,
  TAllAvailableOperatorsForDisplay,
  TExternalFilter,
  TFilterConditionNode,
  TFilterConditionNodeForDisplay,
  TFilterConditionPayload,
  TFilterExpression,
  TFilterProperty,
  TFilterValue,
  TLogicalOperator,
  TSupportedOperators,
} from "@plane/types";
import { FILTER_NODE_TYPE } from "@plane/types";
// local imports
import {
  deepCompareFilterExpressions,
  extractConditions,
  extractConditionsWithDisplayOperators,
  findConditionsByPropertyAndOperator,
  findNodeById,
  hasValidValue,
  removeNodeFromExpression,
  sanitizeAndStabilizeExpression,
  shouldNotifyChangeForExpression,
  updateNodeInExpression,
} from "@plane/utils";
import type { IFilterConfigManager } from "./config-manager";
import { FilterConfigManager } from "./config-manager";
import type { IFilterInstanceHelper } from "./filter-helpers";
import { FilterInstanceHelper } from "./filter-helpers";

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
 * - allConditionsForDisplay: All conditions in the filter expression
 * - addCondition: Adds a condition to the filter expression
 * - updateConditionOperator: Updates the operator of a condition in the filter expression
 * - updateConditionValue: Updates the value of a condition in the filter expression
 * - removeCondition: Removes a condition from the filter expression
 * - clearFilters: Clears the filter expression
 * @template P - The filter property type extending TFilterProperty
 * @template E - The external filter type extending TExternalFilter
 */
export interface IFilterInstance<P extends TFilterProperty, E extends TExternalFilter> {
  // observables
  id: string;
  initialFilterExpression: TFilterExpression<P> | null;
  expression: TFilterExpression<P> | null;
  adapter: IFilterAdapter<P, E>;
  configManager: IFilterConfigManager<P>;
  onExpressionChange?: (expression: E) => void;
  // computed
  hasActiveFilters: boolean;
  hasChanges: boolean;
  isVisible: boolean;
  allConditions: TFilterConditionNode<P, TFilterValue>[];
  allConditionsForDisplay: TFilterConditionNodeForDisplay<P, TFilterValue>[];
  // computed option helpers
  clearFilterOptions: TClearFilterOptions | undefined;
  saveViewOptions: TSaveViewOptions<E> | undefined;
  updateViewOptions: TUpdateViewOptions<E> | undefined;
  // computed permissions
  canClearFilters: boolean;
  canSaveView: boolean;
  canUpdateView: boolean;
  // visibility
  toggleVisibility: (isVisible?: boolean) => void;
  // filter expression actions
  resetExpression: (externalExpression: E, shouldResetInitialExpression?: boolean) => void;
  // filter condition
  findConditionsByPropertyAndOperator: (
    property: P,
    operator: TAllAvailableOperatorsForDisplay
  ) => TFilterConditionNodeForDisplay<P, TFilterValue>[];
  findFirstConditionByPropertyAndOperator: (
    property: P,
    operator: TAllAvailableOperatorsForDisplay
  ) => TFilterConditionNodeForDisplay<P, TFilterValue> | undefined;
  addCondition: <V extends TFilterValue>(
    groupOperator: TLogicalOperator,
    condition: TFilterConditionPayload<P, V>,
    isNegation: boolean
  ) => void;
  updateConditionProperty: (
    conditionId: string,
    property: P,
    operator: TSupportedOperators,
    isNegation: boolean
  ) => void;
  updateConditionOperator: (conditionId: string, operator: TSupportedOperators, isNegation: boolean) => void;
  updateConditionValue: <V extends TFilterValue>(
    conditionId: string,
    value: SingleOrArray<V>,
    forceUpdate?: boolean
  ) => void;
  removeCondition: (conditionId: string) => void;
  // config actions
  clearFilters: () => Promise<void>;
  saveView: () => Promise<void>;
  updateView: () => Promise<void>;
  // expression options actions
  updateExpressionOptions: (newOptions: Partial<TExpressionOptions<E>>) => void;
}

type TFilterParams<P extends TFilterProperty, E extends TExternalFilter> = {
  adapter: IFilterAdapter<P, E>;
  options?: Partial<TFilterOptions<E>>;
  initialExpression?: E;
  onExpressionChange?: (expression: E) => void;
};

export class FilterInstance<P extends TFilterProperty, E extends TExternalFilter> implements IFilterInstance<P, E> {
  // observables
  id: string;
  initialFilterExpression: TFilterExpression<P> | null;
  expression: TFilterExpression<P> | null;
  expressionOptions: TExpressionOptions<E>;
  adapter: IFilterAdapter<P, E>;
  configManager: IFilterConfigManager<P>;
  onExpressionChange?: (expression: E) => void;

  // helper instance
  private helper: IFilterInstanceHelper<P, E>;

  constructor(params: TFilterParams<P, E>) {
    this.id = uuidv4();
    this.adapter = params.adapter;
    this.helper = new FilterInstanceHelper<P, E>(this, {
      adapter: this.adapter,
    });
    this.configManager = new FilterConfigManager<P, E>(this, {
      options: params.options?.config,
    });
    // initialize expression
    const initialExpression = this.helper.initializeExpression(params.initialExpression);
    this.initialFilterExpression = cloneDeep(initialExpression);
    this.expression = cloneDeep(initialExpression);
    this.expressionOptions = this.helper.initializeExpressionOptions(params.options?.expression);
    this.onExpressionChange = params.onExpressionChange;
    this.helper.setInitialVisibility(params.options?.visibility ?? DEFAULT_FILTER_VISIBILITY_OPTIONS);

    makeObservable(this, {
      // observables
      id: observable,
      initialFilterExpression: observable,
      expression: observable,
      expressionOptions: observable.struct,
      adapter: observable,
      configManager: observable,
      // computed
      hasActiveFilters: computed,
      hasChanges: computed,
      isVisible: computed,
      allConditions: computed,
      allConditionsForDisplay: computed,
      // computed option helpers
      clearFilterOptions: computed,
      saveViewOptions: computed,
      updateViewOptions: computed,
      // computed permissions
      canClearFilters: computed,
      canSaveView: computed,
      canUpdateView: computed,
      // actions
      resetExpression: action,
      findConditionsByPropertyAndOperator: action,
      findFirstConditionByPropertyAndOperator: action,
      addCondition: action,
      updateConditionOperator: action,
      updateConditionValue: action,
      removeCondition: action,
      clearFilters: action,
      saveView: action,
      updateView: action,
      updateExpressionOptions: action,
    });
  }

  // ------------ computed ------------

  /**
   * Checks if the filter instance has any active filters.
   * @returns True if the filter instance has any active filters, false otherwise.
   */
  get hasActiveFilters(): IFilterInstance<P, E>["hasActiveFilters"] {
    // if the expression is null, return false
    if (!this.expression) return false;
    // if there are no conditions, return false
    if (this.allConditionsForDisplay.length === 0) return false;
    // if there are conditions, return true if any of them have a valid value
    return this.allConditionsForDisplay.some((condition) => hasValidValue(condition.value));
  }

  /**
   * Checks if the filter instance has any changes with respect to the initial expression.
   * @returns True if the filter instance has any changes, false otherwise.
   */
  get hasChanges(): IFilterInstance<P, E>["hasChanges"] {
    return !deepCompareFilterExpressions(this.initialFilterExpression, this.expression);
  }

  /**
   * Returns the visibility of the filter instance.
   * @returns The visibility of the filter instance.
   */
  get isVisible(): IFilterInstance<P, E>["isVisible"] {
    return this.helper.isVisible;
  }

  /**
   * Returns all conditions from the filter expression.
   * @returns An array of filter conditions.
   */
  get allConditions(): IFilterInstance<P, E>["allConditions"] {
    if (!this.expression) return [];
    return extractConditions(this.expression);
  }

  /**
   * Returns all conditions in the filter expression for display purposes.
   * @returns An array of filter conditions for display purposes.
   */
  get allConditionsForDisplay(): IFilterInstance<P, E>["allConditionsForDisplay"] {
    if (!this.expression) return [];
    return extractConditionsWithDisplayOperators(this.expression);
  }

  // ------------ computed option helpers ------------

  /**
   * Returns the clear filter options.
   * @returns The clear filter options.
   */
  get clearFilterOptions(): IFilterInstance<P, E>["clearFilterOptions"] {
    return this.expressionOptions.clearFilterOptions;
  }

  /**
   * Returns the save view options.
   * @returns The save view options.
   */
  get saveViewOptions(): IFilterInstance<P, E>["saveViewOptions"] {
    return this.expressionOptions.saveViewOptions;
  }

  /**
   * Returns the update view options.
   * @returns The update view options.
   */
  get updateViewOptions(): IFilterInstance<P, E>["updateViewOptions"] {
    return this.expressionOptions.updateViewOptions;
  }

  // ------------ computed permissions ------------

  /**
   * Checks if the filter expression can be cleared.
   * @returns True if the filter expression can be cleared, false otherwise.
   */
  get canClearFilters(): IFilterInstance<P, E>["canClearFilters"] {
    if (!this.expression) return false;
    if (this.allConditionsForDisplay.length === 0) return false;
    return this.clearFilterOptions ? !this.clearFilterOptions.isDisabled : true;
  }

  /**
   * Checks if the filter expression can be saved as a view.
   * @returns True if the filter instance can be saved, false otherwise.
   */
  get canSaveView(): IFilterInstance<P, E>["canSaveView"] {
    return this.hasActiveFilters && !!this.saveViewOptions && !this.saveViewOptions.isDisabled;
  }

  /**
   * Checks if the filter expression can be updated as a view.
   * @returns True if the filter expression can be updated, false otherwise.
   */
  get canUpdateView(): IFilterInstance<P, E>["canUpdateView"] {
    return (
      !!this.updateViewOptions &&
      (this.hasChanges || !!this.updateViewOptions.hasAdditionalChanges) &&
      !this.updateViewOptions.isDisabled
    );
  }

  // ------------ actions ------------

  /**
   * Toggles the visibility of the filter instance.
   * @param isVisible - The visibility to set.
   */
  toggleVisibility: IFilterInstance<P, E>["toggleVisibility"] = action((isVisible) => {
    this.helper.toggleVisibility(isVisible);
  });

  /**
   * Resets the filter expression to the initial expression.
   * @param externalExpression - The external expression to reset to.
   */
  resetExpression: IFilterInstance<P, E>["resetExpression"] = action(
    (externalExpression, shouldResetInitialExpression = true) => {
      this.expression = this.helper.initializeExpression(externalExpression);
      if (shouldResetInitialExpression) {
        this._resetInitialFilterExpression();
      }
      this._notifyExpressionChange();
    }
  );

  /**
   * Finds all conditions by property and operator.
   * @param property - The property to find the conditions by.
   * @param operator - The operator to find the conditions by.
   * @returns All the conditions that match the property and operator.
   */
  findConditionsByPropertyAndOperator: IFilterInstance<P, E>["findConditionsByPropertyAndOperator"] = action(
    (property, operator) => {
      if (!this.expression) return [];
      return findConditionsByPropertyAndOperator(this.expression, property, operator);
    }
  );

  /**
   * Finds the first condition by property and operator.
   * @param property - The property to find the condition by.
   * @param operator - The operator to find the condition by.
   * @returns The first condition that matches the property and operator.
   */
  findFirstConditionByPropertyAndOperator: IFilterInstance<P, E>["findFirstConditionByPropertyAndOperator"] = action(
    (property, operator) => {
      if (!this.expression) return undefined;
      const conditions = findConditionsByPropertyAndOperator(this.expression, property, operator);
      return conditions[0];
    }
  );

  /**
   * Adds a condition to the filter expression.
   * @param groupOperator - The logical operator to use for the condition.
   * @param condition - The condition to add.
   * @param isNegation - Whether the condition should be negated.
   */
  addCondition: IFilterInstance<P, E>["addCondition"] = action((groupOperator, condition, isNegation = false) => {
    const conditionValue = condition.value;

    this.expression = this.helper.addConditionToExpression(this.expression, groupOperator, condition, isNegation);

    if (hasValidValue(conditionValue)) {
      this._notifyExpressionChange();
    }
  });

  /**
   * Updates the property of a condition in the filter expression.
   * @param conditionId - The id of the condition to update.
   * @param property - The new property for the condition.
   */
  updateConditionProperty: IFilterInstance<P, E>["updateConditionProperty"] = action(
    (conditionId: string, property: P, operator: TSupportedOperators, isNegation: boolean) => {
      if (!this.expression) return;
      const conditionBeforeUpdate = cloneDeep(findNodeById(this.expression, conditionId));
      if (!conditionBeforeUpdate || conditionBeforeUpdate.type !== FILTER_NODE_TYPE.CONDITION) return;

      // Update the condition property
      const updatedExpression = this.helper.handleConditionPropertyUpdate(
        this.expression,
        conditionId,
        property,
        operator,
        isNegation
      );

      if (updatedExpression) {
        this.expression = updatedExpression;
        this._notifyExpressionChange();
      }
    }
  );

  /**
   * Updates the operator of a condition in the filter expression.
   * @param conditionId - The id of the condition to update.
   * @param operator - The new operator for the condition.
   */
  updateConditionOperator: IFilterInstance<P, E>["updateConditionOperator"] = action(
    (conditionId: string, operator: TSupportedOperators, isNegation: boolean) => {
      if (!this.expression) return;
      const conditionBeforeUpdate = cloneDeep(findNodeById(this.expression, conditionId));
      if (!conditionBeforeUpdate || conditionBeforeUpdate.type !== FILTER_NODE_TYPE.CONDITION) return;

      // Get the operator configs for the current and new operators
      const currentOperatorConfig = this.configManager
        .getConfigByProperty(conditionBeforeUpdate.property)
        ?.getOperatorConfig(conditionBeforeUpdate.operator);
      const newOperatorConfig = this.configManager
        .getConfigByProperty(conditionBeforeUpdate.property)
        ?.getOperatorConfig(operator);
      // Reset the value if the operator config types are different
      const shouldResetConditionValue = currentOperatorConfig?.type !== newOperatorConfig?.type;

      // Use restructuring logic for operator changes
      const updatedExpression = this.helper.restructureExpressionForOperatorChange(
        this.expression,
        conditionId,
        operator,
        isNegation,
        shouldResetConditionValue
      );

      if (updatedExpression) {
        this.expression = updatedExpression;
      }

      if (hasValidValue(conditionBeforeUpdate.value)) {
        this._notifyExpressionChange();
      }
    }
  );

  /**
   * Updates the value of a condition in the filter expression with automatic optimization.
   * @param conditionId - The id of the condition to update.
   * @param value - The new value for the condition.
   * @param forceUpdate - Whether to force the update even if the value is the same as the condition before update.
   */
  updateConditionValue: IFilterInstance<P, E>["updateConditionValue"] = action(
    <V extends TFilterValue>(conditionId: string, value: SingleOrArray<V>, forceUpdate: boolean = false) => {
      // If the expression is not valid, return
      if (!this.expression) return;

      // Get the condition before update
      const conditionBeforeUpdate = cloneDeep(findNodeById(this.expression, conditionId));

      // If the condition is not valid, return
      if (!conditionBeforeUpdate || conditionBeforeUpdate.type !== FILTER_NODE_TYPE.CONDITION) return;

      // If the value is not valid, remove the condition
      if (!hasValidValue(value)) {
        this.removeCondition(conditionId);
        return;
      }

      // If the value is the same as the condition before update, return
      if (!forceUpdate && isEqual(conditionBeforeUpdate.value, value)) {
        return;
      }

      // Update the condition value
      updateNodeInExpression(this.expression, conditionId, {
        value,
      });

      // Notify the change
      this._notifyExpressionChange();
    }
  );

  /**
   * Removes a condition from the filter expression.
   * @param conditionId - The id of the condition to remove.
   */
  removeCondition: IFilterInstance<P, E>["removeCondition"] = action((conditionId) => {
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
  clearFilters: IFilterInstance<P, E>["clearFilters"] = action(async () => {
    if (this.canClearFilters) {
      const shouldNotify = shouldNotifyChangeForExpression(this.expression);
      this.expression = null;
      await this.clearFilterOptions?.onFilterClear();
      if (shouldNotify) {
        this._notifyExpressionChange();
      }
    } else {
      console.warn("Cannot clear filters: invalid expression or missing options.");
    }
  });

  /**
   * Saves the filter expression.
   */
  saveView: IFilterInstance<P, E>["saveView"] = action(async () => {
    if (this.canSaveView && this.saveViewOptions) {
      await this.saveViewOptions.onViewSave(this._getExternalExpression());
    } else {
      console.warn("Cannot save view: invalid expression or missing options.");
    }
  });

  /**
   * Updates the filter expression.
   */
  updateView: IFilterInstance<P, E>["updateView"] = action(async () => {
    if (this.canUpdateView && this.updateViewOptions) {
      await this.updateViewOptions.onViewUpdate(this._getExternalExpression());
      this._resetInitialFilterExpression();
    } else {
      console.warn("Cannot update view: invalid expression or missing options.");
    }
  });

  /**
   * Updates the expression options for the filter instance.
   * This allows dynamic updates to options like isDisabled properties.
   */
  updateExpressionOptions: IFilterInstance<P, E>["updateExpressionOptions"] = action((newOptions) => {
    this.expressionOptions = {
      ...this.expressionOptions,
      ...newOptions,
    };
  });

  // ------------ private helpers ------------
  /**
   * Resets the initial filter expression to the current expression.
   */
  private _resetInitialFilterExpression(): void {
    this.initialFilterExpression = cloneDeep(this.expression);
  }

  /**
   * Returns the external filter representation of the filter instance.
   * @returns The external filter representation of the filter instance.
   */
  private _getExternalExpression = computedFn(() =>
    this.adapter.toExternal(sanitizeAndStabilizeExpression(toJS(this.expression)))
  );

  /**
   * Notifies the parent component of the expression change.
   */
  private _notifyExpressionChange(): void {
    this.onExpressionChange?.(this._getExternalExpression());
  }
}
