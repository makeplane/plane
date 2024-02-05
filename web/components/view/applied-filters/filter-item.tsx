import { FC } from "react";
import { User, X } from "lucide-react";
// hooks
import { useViewDetail } from "hooks/store";
// types
import { TViewFilters, TViewTypes } from "@plane/types";

type TViewAppliedFiltersItem = {
  workspaceSlug: string;
  projectId: string | undefined;
  viewId: string;
  viewType: TViewTypes;
  filterKey: keyof TViewFilters;
  filterId: string;
};

export const ViewAppliedFiltersItem: FC<TViewAppliedFiltersItem> = (props) => {
  const { workspaceSlug, projectId, viewId, viewType, filterKey, filterId } = props;
  // hooks
  const viewDetailStore = useViewDetail(workspaceSlug, projectId, viewId, viewType);

  const removeFilterOption = () => {
    const filters = viewDetailStore?.appliedFilters?.filters;
    if (!filters) return;
    const filterValues = filters[filterKey];
    const updatedFilterValues = filterValues.filter((value) => value !== filterId);
    viewDetailStore?.setFilters({ [filterKey]: updatedFilterValues });
  };

  return (
    <div
      key={`filter_value_${filterKey}_${filterId}`}
      className="border border-custom-border-200 rounded relative flex items-center gap-1 px-1 py-0.5"
    >
      <div className="flex-shrink-0 w-4 h-4 relative flex justify-center items-center overflow-hidden">
        <User size={12} />
      </div>
      <div className="text-xs">
        {filterKey} - {filterId}
      </div>
      <div
        className="flex-shrink-0 w-3.5 h-3.5 relative flex justify-center items-center overflow-hidden rounded-full transition-all cursor-pointer bg-custom-background-80 hover:bg-custom-background-90 text-custom-text-300 hover:text-custom-text-200"
        onClick={removeFilterOption}
      >
        <X size={10} />
      </div>
    </div>
  );
};
