import { FC } from "react";
import { observer } from "mobx-react-lite";
// hooks
import { useViewDetail, useViewFilter } from "hooks/store";
// components
import { ViewDisplayFiltersItem, ViewDisplayFilterSelection } from "..";
// types
import { TViewDisplayFilters, TViewTypes } from "@plane/types";

type TViewDisplayFiltersItemRoot = {
  workspaceSlug: string;
  projectId: string | undefined;
  viewId: string;
  viewType: TViewTypes;
  filterKey: keyof TViewDisplayFilters;
};

export const ViewDisplayFiltersItemRoot: FC<TViewDisplayFiltersItemRoot> = observer((props) => {
  const { workspaceSlug, projectId, viewId, viewType, filterKey } = props;
  // hooks
  const viewDetailStore = useViewDetail(workspaceSlug, projectId, viewId, viewType);
  const viewFilterHelper = useViewFilter(workspaceSlug, projectId);

  const filterPropertyIds = viewFilterHelper?.displayFilterIdsWithKey(filterKey) || [];

  const handlePropertySelection = (_propertyId: string) => {
    viewDetailStore?.setDisplayFilters({ [filterKey]: _propertyId });
  };

  const renderElement = (_propertyId: string) =>
    filterKey === "group_by"
      ? viewDetailStore?.appliedFilters?.display_filters?.["sub_group_by"] !== _propertyId
        ? true
        : false
      : filterKey === "sub_group_by"
      ? viewDetailStore?.appliedFilters?.display_filters?.["group_by"] !== _propertyId
        ? true
        : false
      : true;

  if (filterPropertyIds.length <= 0)
    return <div className="text-xs italic py-1 text-custom-text-300">No items are available.</div>;
  return (
    <div className="space-y-0.5">
      {filterPropertyIds.map(
        (propertyId) =>
          renderElement(propertyId) && (
            <button
              key={`filterKey_${propertyId}`}
              className="relative w-full flex items-center overflow-hidden gap-2.5 cursor-pointer p-1 py-1.5 rounded hover:bg-custom-background-80 transition-all group"
              onClick={() => handlePropertySelection(propertyId)}
            >
              <ViewDisplayFilterSelection
                workspaceSlug={workspaceSlug}
                projectId={projectId}
                viewId={viewId}
                viewType={viewType}
                filterKey={filterKey}
                propertyId={propertyId}
              />
              <ViewDisplayFiltersItem
                workspaceSlug={workspaceSlug}
                projectId={projectId}
                filterKey={filterKey}
                propertyId={propertyId}
              />
            </button>
          )
      )}
    </div>
  );
});
