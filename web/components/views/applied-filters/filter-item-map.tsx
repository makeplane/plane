import { FC, useMemo } from "react";
import { observer } from "mobx-react";
// components
import { ViewAppliedFiltersItem } from "./";
// hooks
import { useViewFilter } from "hooks/user-view-filters";
// types
import { IIssueFilterOptions } from "@plane/types";

type TViewAppliedFiltersItemMap = {
  workspaceSlug: string;
  projectId: string;
  filterKey: keyof IIssueFilterOptions;
  filterValue: string[];
};

export const ViewAppliedFiltersItemMap: FC<TViewAppliedFiltersItemMap> = observer((props) => {
  const { workspaceSlug, projectId, filterKey, filterValue } = props;
  // hooks
  const viewFilterStore = useViewFilter(workspaceSlug, projectId);

  const currentDefaultFilterDetails = useMemo(
    () => viewFilterStore?.propertyDefaultDetails(filterKey),
    [viewFilterStore, filterKey]
  );

  const propertyVisibleCount = 3;

  if (!filterValue) return <></>;

  return (
    <div className="relative flex items-center gap-2 border border-custom-border-200 rounded p-1 px-1.5">
      <div className="flex-shrink-0 text-xs text-custom-text-200 capitalize">{filterKey.replaceAll("_", " ")}</div>
      <div className="relative flex items-center gap-1.5 flex-wrap">
        {propertyVisibleCount && filterValue.length >= propertyVisibleCount ? (
          <div className="text-xs bg-custom-primary-100/20 rounded relative flex items-center gap-1 p-1 px-2">
            <div className="flex-shrink-0 w-4-h-4">{currentDefaultFilterDetails?.icon}</div>
            <div className="whitespace-nowrap">
              {filterValue.length} {currentDefaultFilterDetails?.label}
            </div>
          </div>
        ) : (
          <>
            {filterValue.map((propertyId) => (
              <ViewAppliedFiltersItem
                key={`filter_value_${filterKey}_${propertyId}`}
                workspaceSlug={workspaceSlug}
                projectId={projectId}
                filterKey={filterKey}
                propertyId={propertyId}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
});
