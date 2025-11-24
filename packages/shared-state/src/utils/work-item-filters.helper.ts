// plane imports
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
