/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { action, makeObservable, observable } from "mobx";
import { computedFn } from "mobx-utils";
// plane imports
import type { WorkItemFiltersEntity } from "@plane/constants";
import type { TWorkItemFilterExpression } from "@plane/types";
import { LOGICAL_OPERATOR } from "@plane/types";
import { getOperatorForPayload } from "@plane/utils";
// local imports
import type { TWorkItemFilterCondition } from "../../utils";
import { buildWorkItemFilterExpressionFromConditions } from "../../utils";
import type { InitializePQLFilterInstanceParams } from "../pql/filter";
import type { TWorkItemFilterKey } from "./shared";
import type { WorkItemFilterInstanceInitParams } from "./filter";
import { WorkItemFilterInstance } from "./filter";

type TGetOrCreateFilterParams = WorkItemFilterInstanceInitParams<TWorkItemFilterExpression> & {
  entityId: string;
  entityType: WorkItemFiltersEntity;
};

export interface IWorkItemFilterStore {
  filters: Map<TWorkItemFilterKey, WorkItemFilterInstance>; // key is the entity id (project, cycle, workspace, teamspace, etc)
  getFilter: (entityType: WorkItemFiltersEntity, entityId: string) => WorkItemFilterInstance | undefined;
  getOrCreateFilter: (params: TGetOrCreateFilterParams) => WorkItemFilterInstance;
  resetExpression: (entityType: WorkItemFiltersEntity, entityId: string, expression: TWorkItemFilterExpression) => void;
  updateFilterExpressionFromConditions: (
    entityType: WorkItemFiltersEntity,
    entityId: string,
    conditions: TWorkItemFilterCondition[],
    fallbackFn: (expression: TWorkItemFilterExpression) => Promise<void>
  ) => Promise<void>;
  updateFilterValueFromSidebar: (
    entityType: WorkItemFiltersEntity,
    entityId: string,
    condition: TWorkItemFilterCondition
  ) => void;
  deleteFilter: (entityType: WorkItemFiltersEntity, entityId: string) => void;
}

export class WorkItemFilterStore implements IWorkItemFilterStore {
  // observable
  filters: IWorkItemFilterStore["filters"];

  constructor() {
    this.filters = new Map<TWorkItemFilterKey, WorkItemFilterInstance>();
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
   * If the instance already exists, refreshes its callbacks and view options to keep computed state in sync.
   */
  getOrCreateFilter: IWorkItemFilterStore["getOrCreateFilter"] = action((params) => {
    const existingFilter = this.getFilter(params.entityType, params.entityId);
    if (existingFilter) {
      existingFilter.viewOptions = params.viewOptions;

      existingFilter.richFiltersInstance?.updateExpressionOptions({
        ...params.richFilters?.expressionOptions,
        saveViewOptions: params.viewOptions?.saveViewOptions,
        updateViewOptions: params.viewOptions?.updateViewOptions,
      });

      // Update callback if provided
      if (params.richFilters?.onExpressionChange && existingFilter.richFiltersInstance) {
        existingFilter.richFiltersInstance.onExpressionChange = params.richFilters.onExpressionChange;
      }

      existingFilter.pqlFiltersInstance?.updateOptions({
        viewOptions: params.viewOptions as InitializePQLFilterInstanceParams["viewOptions"],
      });

      // Update visibility if provided
      if (params.showOnMount !== undefined) {
        existingFilter.richFiltersInstance?.toggleVisibility(params.showOnMount);
      }

      return existingFilter;
    }

    // create new filter instance
    const newInstance = this._initializeFilterInstances(params);
    const filterKey = this._getFilterKey(params.entityType, params.entityId);
    this.filters.set(filterKey, newInstance);

    return newInstance;
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
      filter.richFiltersInstance?.resetExpression(expression);
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
        filter.richFiltersInstance?.resetExpression(newFilterExpression, false);
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
      const conditionNode = filter.richFiltersInstance?.findFirstConditionByPropertyAndOperator(
        condition.property,
        condition.operator
      );

      // No existing condition found - add new condition with AND logic
      if (!conditionNode) {
        const { operator, isNegation } = getOperatorForPayload(condition.operator);

        // Create the condition payload with normalized operator
        const conditionPayload = {
          property: condition.property,
          operator,
          value: condition.value,
        };

        filter.richFiltersInstance?.addCondition(LOGICAL_OPERATOR.AND, conditionPayload, isNegation);
        return;
      }

      // Update existing condition (assuming single condition per property-operator pair)
      filter.richFiltersInstance?.updateConditionValue(conditionNode.id, condition.value);
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
  _getFilterKey = (entityType: WorkItemFiltersEntity, entityId: string): TWorkItemFilterKey =>
    `${entityType}-${entityId}`;

  /**
   * Initializes a filter instance.
   * @param params - The parameters for the filter instance.
   * @returns Rich and PQL filter instances.
   */
  _initializeFilterInstances = (params: TGetOrCreateFilterParams) => {
    const workItemFilterInstance = new WorkItemFilterInstance(params);
    return workItemFilterInstance;
  };
}
