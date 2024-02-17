import { FC, Fragment, useCallback, useMemo } from "react";
import { observer } from "mobx-react-lite";
import isEmpty from "lodash/isEmpty";
import { X } from "lucide-react";
// hooks
import { useViewDetail, useViewFilter } from "hooks/store";
// components
import { ViewAppliedFiltersItem } from "./filter-item";
// types
import { TViewFilters, TViewTypes } from "@plane/types";

type TViewAppliedFilters = {
  workspaceSlug: string;
  projectId: string | undefined;
  viewId: string;
  viewType: TViewTypes;
  filterKey: keyof TViewFilters;
  propertyVisibleCount?: number | undefined;
  isLocalView: boolean;
};

export const ViewAppliedFilters: FC<TViewAppliedFilters> = observer((props) => {
  const { workspaceSlug, projectId, viewId, viewType, filterKey, propertyVisibleCount, isLocalView } = props;
  // hooks
  const viewDetailStore = useViewDetail(workspaceSlug, projectId, viewId, viewType, isLocalView);
  const viewFilterStore = useViewFilter(workspaceSlug, projectId);

  const currentDefaultFilterDetails = useMemo(
    () => viewFilterStore?.propertyDefaultDetails(filterKey),
    [viewFilterStore, filterKey]
  );

  const propertyValues = useMemo(
    () =>
      viewDetailStore?.appliedFilters?.filters && !isEmpty(viewDetailStore?.appliedFilters?.filters)
        ? viewDetailStore?.appliedFilters?.filters?.[filterKey] || undefined
        : undefined,
    [filterKey, viewDetailStore?.appliedFilters?.filters]
  );

  const clearPropertyFilter = useCallback(
    () => viewDetailStore?.setFilters(filterKey, "clear_all"),
    [viewDetailStore, filterKey]
  );

  if (!propertyValues || propertyValues.length <= 0) return <></>;
  return (
    <div className="relative flex items-center gap-2 border border-custom-border-200 rounded p-1 px-1.5">
      <div className="flex-shrink-0 text-xs text-custom-text-200 capitalize">{filterKey.replaceAll("_", " ")}</div>
      <div className="relative flex items-center gap-1.5 flex-wrap">
        {propertyVisibleCount && propertyValues.length >= propertyVisibleCount ? (
          <div className="text-xs bg-custom-primary-100/20 rounded relative flex items-center gap-1 p-1 px-2">
            <div className="flex-shrink-0 w-4-h-4">{currentDefaultFilterDetails?.icon}</div>
            <div className="whitespace-nowrap">
              {propertyValues.length} {currentDefaultFilterDetails?.label}
            </div>
          </div>
        ) : (
          <>
            {propertyValues.map((propertyId) => (
              <Fragment key={propertyId}>
                <ViewAppliedFiltersItem
                  workspaceSlug={workspaceSlug}
                  projectId={projectId}
                  viewId={viewId}
                  viewType={viewType}
                  filterKey={filterKey}
                  propertyId={propertyId}
                  isLocalView={isLocalView}
                />
              </Fragment>
            ))}
          </>
        )}
      </div>
      <div
        className="flex-shrink-0 relative flex justify-center items-center w-4 h-4 rounded-full cursor-pointer transition-all bg-custom-background-80 hover:bg-custom-background-90 text-custom-text-300 hover:text-custom-text-200"
        onClick={clearPropertyFilter}
      >
        <X size={10} />
      </div>
    </div>
  );
});
