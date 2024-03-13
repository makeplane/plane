import { FC } from "react";
import { ImagePlus } from "lucide-react";
// types
import { IIssueFilterOptions } from "@plane/types";
import { useViewFilter } from "hooks/user-view-filters";

type TViewAppliedFiltersItem = {
  workspaceSlug: string;
  projectId: string;
  filterKey: keyof IIssueFilterOptions;
  propertyId: string;
};

export const ViewAppliedFiltersItem: FC<TViewAppliedFiltersItem> = (props) => {
  const { workspaceSlug, projectId, filterKey, propertyId } = props;
  // hooks
  const viewFilterHelper = useViewFilter(workspaceSlug, projectId);
  const propertyDetail = viewFilterHelper?.propertyDetails(filterKey, propertyId) || undefined;

  if (!filterKey || !propertyId) return <></>;
  return (
    <div
      key={`filter_value_${filterKey}_${propertyId}`}
      className="bg-custom-background-80 rounded relative flex items-center gap-1.5 p-1"
    >
      <div className="flex-shrink-0 w-4 h-4 relative flex justify-center items-center overflow-hidden">
        {propertyDetail?.icon || <ImagePlus size={14} />}
      </div>
      <div className="text-xs">{propertyDetail?.label || propertyId}</div>
    </div>
  );
};
