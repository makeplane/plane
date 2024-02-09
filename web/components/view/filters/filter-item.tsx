import { FC, Fragment } from "react";
import { ImagePlus } from "lucide-react";
// hooks
import { useViewFilter } from "hooks/store";
// types
import { TViewFilters } from "@plane/types";

type TViewFiltersItem = {
  workspaceSlug: string;
  projectId: string | undefined;

  filterKey: keyof TViewFilters;
  propertyId: string;
};

export const ViewFiltersItem: FC<TViewFiltersItem> = (props) => {
  const { workspaceSlug, projectId, filterKey, propertyId } = props;
  // hooks
  const viewFilterHelper = useViewFilter(workspaceSlug, projectId);

  const propertyDetail = viewFilterHelper?.propertyDetails(filterKey, propertyId) || undefined;

  if (!propertyDetail) return <></>;
  return (
    <Fragment>
      <div className="flex-shrink-0 w-4 h-4 flex justify-center items-center">
        {propertyDetail?.icon || <ImagePlus size={14} />}
      </div>
      <div className="text-xs block truncate line-clamp-1 text-custom-text-200 group-hover:text-custom-text-100">
        {propertyDetail?.label || propertyId}
      </div>
    </Fragment>
  );
};
