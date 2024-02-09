import { FC, useState } from "react";
import { observer } from "mobx-react-lite";
// hooks
import { useViewFilter } from "hooks/store";
// components
import { ViewFiltersItem, ViewFilterSelection } from "../";
// types
import { TViewOperations } from "../types";
import { TViewFilters, TViewTypes } from "@plane/types";

type TViewFiltersItemRoot = {
  workspaceSlug: string;
  projectId: string | undefined;
  viewId: string;
  viewType: TViewTypes;
  viewOperations: TViewOperations;
  filterKey: keyof TViewFilters;
};

export const ViewFiltersItemRoot: FC<TViewFiltersItemRoot> = observer((props) => {
  const { workspaceSlug, projectId, viewId, viewType, viewOperations, filterKey } = props;
  // hooks
  const viewFilterHelper = useViewFilter(workspaceSlug, projectId);
  // state
  const [viewAll, setViewAll] = useState(false);

  const propertyIds = viewFilterHelper?.filterIdsWithKey(filterKey) || [];

  const filterPropertyIds = propertyIds.length > 5 ? (viewAll ? propertyIds : propertyIds.slice(0, 5)) : propertyIds;

  const handlePropertySelection = (_propertyId: string) => viewOperations?.setFilters(filterKey, _propertyId);

  if (propertyIds.length <= 0)
    return <div className="text-xs italic py-1 text-custom-text-300">No items are available.</div>;
  return (
    <div className="space-y-0.5">
      {filterPropertyIds.map((propertyId) => (
        <button
          key={`filterKey_${propertyId}`}
          className="relative w-full flex items-center overflow-hidden gap-2.5 cursor-pointer p-1 py-1.5 rounded hover:bg-custom-background-80 transition-all group"
          onClick={() => handlePropertySelection(propertyId)}
        >
          <ViewFilterSelection
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            viewId={viewId}
            viewType={viewType}
            filterKey={filterKey}
            propertyId={propertyId}
          />
          <ViewFiltersItem
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            filterKey={filterKey}
            propertyId={propertyId}
          />
        </button>
      ))}

      {propertyIds.length > 5 && (
        <div
          className="text-xs transition-all text-custom-primary-100/90 hover:text-custom-primary-100 font-medium pl-8 cursor-pointer py-1"
          onClick={() => setViewAll((prevData) => !prevData)}
        >
          {viewAll ? "View less" : "View all"}
        </div>
      )}
    </div>
  );
});
