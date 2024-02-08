import { FC, Fragment } from "react";
import { CheckSquare } from "lucide-react";
// hooks
import { useViewFilter } from "hooks/store";
// types
import { TViewFilters, TViewTypes } from "@plane/types";
import { TViewOperations } from "../types";
// helpers
// import { filterPropertyItemByFilterKeyAndId } from "../helpers/filters";

type TViewFiltersItem = {
  workspaceSlug: string;
  projectId: string | undefined;
  viewId: string;
  viewType: TViewTypes;
  viewOperations: TViewOperations;
  baseRoute: string;
  filterKey: keyof TViewFilters;
  propertyId: string;
};

export const ViewFiltersItem: FC<TViewFiltersItem> = (props) => {
  const { workspaceSlug, projectId, viewId, viewType, viewOperations, baseRoute, filterKey, propertyId } = props;
  // hooks
  const viewFilterHelper = useViewFilter(workspaceSlug, projectId);

  const propertyDetail = viewFilterHelper?.propertyDetails(filterKey, propertyId) || undefined;

  if (!propertyDetail) return <></>;
  return (
    <Fragment>
      <div className="flex-shrink-0 w-4 h-4 flex justify-center items-center">
        {propertyDetail?.icon || <CheckSquare size={14} />}
      </div>
      <div className="text-xs block truncate line-clamp-1 text-custom-text-200 group-hover:text-custom-text-100">
        {propertyDetail?.label || propertyId}
      </div>
    </Fragment>
  );
};
