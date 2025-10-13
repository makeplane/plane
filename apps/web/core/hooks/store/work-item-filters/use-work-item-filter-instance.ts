// plane imports
import type { IWorkItemFilterInstance } from "@plane/shared-state";
import type { EIssuesStoreType } from "@plane/types";
// local imports
import { useWorkItemFilters } from "./use-work-item-filters";

export const useWorkItemFilterInstance = (
  entityType: EIssuesStoreType,
  entityId: string
): IWorkItemFilterInstance | undefined => {
  const { getFilter } = useWorkItemFilters();
  return getFilter(entityType, entityId);
};
