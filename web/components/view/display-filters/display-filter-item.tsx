import { FC, Fragment } from "react";
// hooks
import { useViewFilter } from "hooks/store";
// types
import { TViewDisplayFilters } from "@plane/types";

type TViewDisplayFiltersItem = {
  workspaceSlug: string;
  projectId: string | undefined;
  filterKey: keyof TViewDisplayFilters;
  propertyId: string;
};

export const ViewDisplayFiltersItem: FC<TViewDisplayFiltersItem> = (props) => {
  const { workspaceSlug, projectId, filterKey, propertyId } = props;
  // hooks
  const viewFilterHelper = useViewFilter(workspaceSlug, projectId);

  const propertyDetail = viewFilterHelper?.displayPropertyDetails(filterKey, propertyId) || undefined;

  if (!propertyDetail) return <></>;
  return (
    <div className="text-xs block truncate line-clamp-1 text-custom-text-200 group-hover:text-custom-text-100">
      {propertyDetail?.label || propertyId}
    </div>
  );
};
