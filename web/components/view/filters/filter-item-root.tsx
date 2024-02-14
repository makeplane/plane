import { FC, useCallback, useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
// hooks
import { useViewDetail, useViewFilter } from "hooks/store";
// components
import { ViewFiltersItem, ViewFilterSelection } from "../";
import { DateFilterModal } from "components/core";
// types
import { TViewFilters, TViewTypes } from "@plane/types";

type TViewFiltersItemRoot = {
  workspaceSlug: string;
  projectId: string | undefined;
  viewId: string;
  viewType: TViewTypes;
  filterKey: keyof TViewFilters;
  dateCustomFilterToggle: string | undefined;
  setDateCustomFilterToggle: (value: string | undefined) => void;
};

export const ViewFiltersItemRoot: FC<TViewFiltersItemRoot> = observer((props) => {
  const { workspaceSlug, projectId, viewId, viewType, filterKey, dateCustomFilterToggle, setDateCustomFilterToggle } =
    props;
  // hooks
  const viewDetailStore = useViewDetail(workspaceSlug, projectId, viewId, viewType);
  const viewFilterHelper = useViewFilter(workspaceSlug, projectId);
  // state
  const [viewAll, setViewAll] = useState(false);

  const propertyIds = useMemo(() => viewFilterHelper?.filterIdsWithKey(filterKey) || [], [viewFilterHelper, filterKey]);

  const filterPropertyIds = useMemo(
    () => (propertyIds.length > 5 ? (viewAll ? propertyIds : propertyIds.slice(0, 5)) : propertyIds),
    [propertyIds, viewAll]
  );

  const handlePropertySelection = useCallback(
    (_propertyId: string) => {
      if (["start_date", "target_date"].includes(filterKey)) {
        if (_propertyId === "custom") {
          const _propertyIds = viewDetailStore?.appliedFilters?.filters?.[filterKey] || [];
          const selectedDates = _propertyIds.filter((id) => id.includes("-"));
          if (selectedDates.length > 0)
            selectedDates.forEach((date: string) => viewDetailStore?.setFilters(filterKey, date));
          else setDateCustomFilterToggle(filterKey);
        } else viewDetailStore?.setFilters(filterKey, _propertyId);
      } else viewDetailStore?.setFilters(filterKey, _propertyId);
    },
    [filterKey, viewDetailStore, setDateCustomFilterToggle]
  );

  const handleCustomDateSelection = useCallback(
    (selectedDates: string[]) => {
      selectedDates.forEach((date: string) => {
        viewDetailStore?.setFilters(filterKey, date);
        setDateCustomFilterToggle(undefined);
      });
    },
    [filterKey, viewDetailStore, setDateCustomFilterToggle]
  );

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

      {dateCustomFilterToggle === filterKey && (
        <DateFilterModal
          handleClose={() => setDateCustomFilterToggle(undefined)}
          isOpen={dateCustomFilterToggle === filterKey ? true : false}
          onSelect={handleCustomDateSelection}
          title="Start date"
        />
      )}
    </div>
  );
});
