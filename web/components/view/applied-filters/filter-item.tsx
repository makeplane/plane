import { FC } from "react";
import { ImagePlus, X } from "lucide-react";
// hooks
import { useViewDetail, useViewFilter } from "hooks/store";
// types
import { TViewFilters, TViewTypes } from "@plane/types";

type TViewAppliedFiltersItem = {
  workspaceSlug: string;
  projectId: string | undefined;
  viewId: string;
  viewType: TViewTypes;
  filterKey: keyof TViewFilters;
  propertyId: string;
};

export const ViewAppliedFiltersItem: FC<TViewAppliedFiltersItem> = (props) => {
  const { workspaceSlug, projectId, viewId, viewType, filterKey, propertyId } = props;
  // hooks
  const viewDetailStore = useViewDetail(workspaceSlug, projectId, viewId, viewType);
  const viewFilterHelper = useViewFilter(workspaceSlug, projectId);

  const propertyDetail = viewFilterHelper?.propertyDetails(filterKey, propertyId) || undefined;

  const removeFilterOption = () => {
    viewDetailStore?.setFilters(filterKey, propertyId);
  };

  return (
    <div
      key={`filter_value_${filterKey}_${propertyId}`}
      className="bg-custom-background-80 rounded relative flex items-center gap-1.5 p-1"
    >
      <div className="flex-shrink-0 w-4 h-4 relative flex justify-center items-center overflow-hidden">
        {propertyDetail?.icon || <ImagePlus size={14} />}
      </div>
      <div className="text-xs">{propertyDetail?.label || propertyId}</div>
      <div
        className="flex-shrink-0 w-3.5 h-3.5 relative flex justify-center items-center overflow-hidden rounded-full transition-all cursor-pointer bg-custom-background-80 hover:bg-custom-background-90 text-custom-text-300 hover:text-custom-text-200"
        onClick={removeFilterOption}
      >
        <X size={10} />
      </div>
    </div>
  );
};
