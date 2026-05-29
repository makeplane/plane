import { observer } from "mobx-react";
// plane imports
import type { EIssuesStoreType } from "@plane/types";
// components
import { FiltersToggle } from "@/components/rich-filters/filters-toggle";
// hooks
import { useWorkItemFilters } from "@/hooks/store/work-item-filters/use-work-item-filters";

type TWorkItemFiltersToggleProps = {
  entityType: EIssuesStoreType;
  entityId: string;
};

export const WorkItemFiltersToggle = observer(function WorkItemFiltersToggle(props: TWorkItemFiltersToggleProps) {
  const { entityType, entityId } = props;
  // store hooks
  const { getFilter } = useWorkItemFilters();
  // derived values
  const filter = getFilter(entityType, entityId);

  return <FiltersToggle filter={filter} />;
});
