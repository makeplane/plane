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

// plane imports
import { EIssuesStoreType } from "@plane/types";
import type {
  TBuildFilterExpressionParams,
  TFilterConditionForBuild,
  TFilterValue,
  TWorkItemFilterExpression,
  TWorkItemFilterProperty,
} from "@plane/types";
// local imports
import { workItemFiltersAdapter } from "../store/work-item-filters/adapter";
import { buildTempFilterExpressionFromConditions } from "./rich-filter.helper";

export type TWorkItemFilterCondition = TFilterConditionForBuild<TWorkItemFilterProperty, TFilterValue>;

/**
 * Builds a work item filter expression from conditions.
 * @param params.conditions - The conditions for building the filter expression.
 * @returns The work item filter expression.
 */
export const buildWorkItemFilterExpressionFromConditions = (
  params: Omit<
    TBuildFilterExpressionParams<TWorkItemFilterProperty, TFilterValue, TWorkItemFilterExpression>,
    "adapter"
  >
): TWorkItemFilterExpression | undefined => {
  const workItemFilterExpression = buildTempFilterExpressionFromConditions({
    ...params,
    adapter: workItemFiltersAdapter,
  });
  if (!workItemFilterExpression) console.error("Failed to build work item filter expression from conditions");
  return workItemFilterExpression;
};

type TEnrichRichFiltersWithEntityContextParams = {
  richFilters: TWorkItemFilterExpression | undefined;
  entityType: EIssuesStoreType;
  entityId: string | undefined;
};

/**
 * Enriches rich filters with entity context based on entity type.
 * Adds entity-specific filter conditions (e.g., cycle_id for cycles, module_id for modules).
 * @param params.richFilters - The initial rich filter expression to enrich.
 * @param params.entityType - The type of entity (cycle, module, etc.).
 * @param params.entityId - The ID of the entity to filter by.
 * @returns The enriched filter expression with entity context, or the original filters if no enrichment is needed.
 */
export const enrichRichFiltersWithEntityContext = (
  params: TEnrichRichFiltersWithEntityContextParams
): TWorkItemFilterExpression | undefined => {
  const { richFilters, entityType, entityId } = params;

  let conditionPayload: TWorkItemFilterCondition | undefined = undefined;

  switch (entityType) {
    case EIssuesStoreType.CYCLE:
      conditionPayload = {
        property: "cycle_id",
        operator: "in",
        value: entityId,
      };
      break;
    case EIssuesStoreType.MODULE:
      conditionPayload = {
        property: "module_id",
        operator: "in",
        value: entityId,
      };
      break;
  }

  if (!conditionPayload) return richFilters;

  return buildWorkItemFilterExpressionFromConditions({
    conditions: [conditionPayload],
    initialExpression: richFilters,
  });
};
