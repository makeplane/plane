import { action, makeObservable, observable } from "mobx";
import { computedFn } from "mobx-utils";
// plane imports
import type { TExpressionOptions } from "@plane/constants";
import type { EIssuesStoreType, TWorkItemFilterExpression, TWorkItemFilterProperty } from "@plane/types";
import { LOGICAL_OPERATOR } from "@plane/types";
import { getOperatorForPayload } from "@plane/utils";
// local imports
import type { TWorkItemFilterCondition } from "../../utils";
import { buildWorkItemFilterExpressionFromConditions } from "../../utils";
import { FilterInstance } from "../rich-filters/filter";
import { workItemFiltersAdapter } from "./adapter";
import type { IWorkItemFilterInstance, TWorkItemFilterKey } from "./shared";

type TGetOrCreateFilterParams = {
  showOnMount?: boolean;
  entityId: string;
  entityType: EIssuesStoreType;
  expressionOptions?: TExpressionOptions<TWorkItemFilterExpression>;
  initialExpression?: TWorkItemFilterExpression;
  onExpressionChange?: (expression: TWorkItemFilterExpression) => void;
};

export interface IWorkItemFilterStore {
  filters: Map<TWorkItemFilterKey, IWorkItemFilterInstance>; // key is the entity id (project, cycle, workspace, teamspace, etc)
  getFilter: (entityType: EIssuesStoreType, entityId: string) => IWorkItemFilterInstance | undefined;
  getOrCreateFilter: (params: TGetOrCreateFilterParams) => IWorkItemFilterInstance;
  resetExpression: (entityType: EIssuesStoreType, entityId: string, expression: TWorkItemFilterExpression) => void;
  updateFilterExpressionFromConditions: (
    entityType: EIssuesStoreType,
    entityId: string,
    conditions: TWorkItemFilterCondition[],
    fallbackFn: (expression: TWorkItemFilterExpression) => Promise<void>
  ) => Promise<void>;
  updateFilterValueFromSidebar: (
    entityType: EIssuesStoreType,
    entityId: string,
    condition: TWorkItemFilterCondition
  ) => void;
  deleteFilter: (entityType: EIssuesStoreType, entityId: string) => void;
}

export class WorkItemFilterStore implements IWorkItemFilterStore {
  // observable
  filters: IWorkItemFilterStore["filters"];

  constructor() {
    this.filters = new Map<TWorkItemFilterKey, IWorkItemFilterInstance>();
    makeObservable(this, {
      filters: observable,
      getOrCreateFilter: action,
      resetExpression: action,
      updateFilterExpressionFromConditions: action,
      deleteFilter: action,
    });
  }

  // ------------ computed functions ------------

  /**
   * Returns a filter instance.
   * @param entityType - The entity type.
   * @param entityId - The entity id.
   * @returns The filter instance.
   */
  getFilter: IWorkItemFilterStore["getFilter"] = computedFn((entityType, entityId) =>
    this.filters.get(this._getFilterKey(entityType, entityId))
  );

  // ------------ actions ------------

  /**
   * Gets or creates a new filter instance.
   * If the instance already exists, updates its expression options to ensure they're current.
   */
  getOrCreateFilter: IWorkItemFilterStore["getOrCreateFilter"] = action((params) => {
    const existingFilter = this.getFilter(params.entityType, params.entityId);
    if (existingFilter) {
      // Update expression options on existing filter to ensure they're current
      if (params.expressionOptions) {
        existingFilter.updateExpressionOptions(params.expressionOptions);
      }
      // Update callback if provided
      if (params.onExpressionChange) {
        existingFilter.onExpressionChange = params.onExpressionChange;
      }
      // Update visibility if provided
      if (params.showOnMount !== undefined) {
        existingFilter.toggleVisibility(params.showOnMount);
      }
      return existingFilter;
    }

    // create new filter instance
    const newFilter = this._initializeFilterInstance(params);
    const filterKey = this._getFilterKey(params.entityType, params.entityId);
    this.filters.set(filterKey, newFilter);

    return newFilter;
  });

  /**
   * Resets the initial expression for a filter instance.
   * @param entityType - The entity type.
   * @param entityId - The entity id.
   * @param expression - The expression to update.
   */
  resetExpression: IWorkItemFilterStore["resetExpression"] = action((entityType, entityId, expression) => {
    const filter = this.getFilter(entityType, entityId);
    if (filter) {
      filter.resetExpression(expression);
    }
  });

  /**
   * Updates the filter expression from conditions.
   * @param entityType - The entity type.
   * @param entityId - The entity id.
   * @param conditions - The conditions to update.
   * @param fallbackFn - The fallback function to update the expression if the filter instance does not exist.
   */
  updateFilterExpressionFromConditions: IWorkItemFilterStore["updateFilterExpressionFromConditions"] = action(
    async (entityType, entityId, conditions, fallbackFn) => {
      const filter = this.getFilter(entityType, entityId);
      const newFilterExpression = buildWorkItemFilterExpressionFromConditions({
        conditions,
      });
      if (!newFilterExpression) return;

      // Update the filter expression using the filter instance if it exists, otherwise use the fallback function
      if (filter) {
        filter.resetExpression(newFilterExpression, false);
      } else {
        await fallbackFn(newFilterExpression);
      }
    }
  );

  /**
   * Handles sidebar filter updates by adding new conditions or updating existing ones.
   * This method processes filter conditions from the sidebar UI and applies them to the
   * appropriate filter instance, handling both positive and negative operators correctly.
   *
   * @param entityType - The entity type (e.g., project, cycle, module)
   * @param entityId - The unique identifier for the entity
   * @param condition - The filter condition containing property, operator, and value
   */
  updateFilterValueFromSidebar: IWorkItemFilterStore["updateFilterValueFromSidebar"] = action(
    (entityType, entityId, condition) => {
      // Retrieve the filter instance for the specified entity
      const filter = this.getFilter(entityType, entityId);

      // Early return if filter instance doesn't exist
      if (!filter) {
        console.warn(
          `Cannot handle sidebar filters update: filter instance not found for entity type "${entityType}" with ID "${entityId}"`
        );
        return;
      }

      // Check for existing conditions with the same property and operator
      const conditionNode = filter.findFirstConditionByPropertyAndOperator(condition.property, condition.operator);

      // No existing condition found - add new condition with AND logic
      if (!conditionNode) {
        const { operator, isNegation } = getOperatorForPayload(condition.operator);

        // Create the condition payload with normalized operator
        const conditionPayload = {
          property: condition.property,
          operator,
          value: condition.value,
        };

        filter.addCondition(LOGICAL_OPERATOR.AND, conditionPayload, isNegation);
        return;
      }

      // Update existing condition (assuming single condition per property-operator pair)
      filter.updateConditionValue(conditionNode.id, condition.value);
    }
  );

  /**
   * Deletes a filter instance.
   * @param entityType - The entity type.
   * @param entityId - The entity id.
   */
  deleteFilter: IWorkItemFilterStore["deleteFilter"] = action((entityType, entityId) => {
    this.filters.delete(this._getFilterKey(entityType, entityId));
  });

  // ------------ private helpers ------------

  /**
   * Returns a filter key.
   * @param entityType - The entity type.
   * @param entityId - The entity id.s
   * @returns The filter key.
   */
  _getFilterKey = (entityType: EIssuesStoreType, entityId: string): TWorkItemFilterKey => `${entityType}-${entityId}`;

  /**
   * Initializes a filter instance.
   * @param params - The parameters for the filter instance.
   * @returns The filter instance.
   */
  _initializeFilterInstance = (params: TGetOrCreateFilterParams) =>
    new FilterInstance<TWorkItemFilterProperty, TWorkItemFilterExpression>({
      adapter: workItemFiltersAdapter,
      initialExpression: params.initialExpression,
      onExpressionChange: params.onExpressionChange,
      options: {
        expression: params.expressionOptions,
        visibility: params.showOnMount
          ? { autoSetVisibility: false, isVisibleOnMount: true }
          : { autoSetVisibility: true },
      },
    });
}
