// plane imports
import { IFilterInstance } from "@plane/shared-state";
import { EIssuesStoreType, TWorkItemFilterExpression, TWorkItemFilterProperty } from "@plane/types";
// local imports
import { useWorkItemFilters } from "./use-work-item-filters";

export const useWorkItemFilterInstance = (
  entityType: EIssuesStoreType,
  entityId: string
): IFilterInstance<TWorkItemFilterProperty, TWorkItemFilterExpression> | undefined => {
  const { getFilter } = useWorkItemFilters();
  return getFilter(entityType, entityId);
};
