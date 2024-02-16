import { FC, useCallback, useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import { ChevronDown, ChevronUp } from "lucide-react";
import concat from "lodash/concat";
import uniq from "lodash/uniq";
import filter from "lodash/filter";
// hooks
import { useViewDetail } from "hooks/store";
// components
import { ViewFiltersItemRoot } from "../";
// types
import { TViewFilters, TViewTypes } from "@plane/types";
import { EViewPageType, viewDefaultFilterParametersByViewTypeAndLayout } from "constants/view";

type TViewFiltersRoot = {
  workspaceSlug: string;
  projectId: string | undefined;
  viewId: string;
  viewType: TViewTypes;
  viewPageType: EViewPageType;
  dateCustomFilterToggle: string | undefined;
  setDateCustomFilterToggle: (value: string | undefined) => void;
  isLocalView: boolean;
};

export const ViewFiltersRoot: FC<TViewFiltersRoot> = observer((props) => {
  const {
    workspaceSlug,
    projectId,
    viewId,
    viewType,
    viewPageType,
    dateCustomFilterToggle,
    setDateCustomFilterToggle,
    isLocalView,
  } = props;
  // hooks
  const viewDetailStore = useViewDetail(workspaceSlug, projectId, viewId, viewType, isLocalView);
  // state
  const [filterVisibility, setFilterVisibility] = useState<Partial<keyof TViewFilters>[]>([]);
  const handleFilterVisibility = useCallback((key: keyof TViewFilters) => {
    setFilterVisibility((prevData = []) => {
      if (prevData.includes(key)) return filter(prevData, (item) => item !== key);
      return uniq(concat(prevData, [key]));
    });
  }, []);

  const filtersProperties = useMemo(() => {
    const layout = viewDetailStore?.appliedFilters?.display_filters?.layout;
    return layout ? viewDefaultFilterParametersByViewTypeAndLayout(viewPageType, layout, "filters") : [];
  }, [viewDetailStore?.appliedFilters?.display_filters?.layout, viewPageType]);

  if (filtersProperties.length <= 0) return <></>;
  return (
    <div className="space-y-1 divide-y divide-custom-border-300">
      {filtersProperties.map((filterKey) => (
        <div key={filterKey} className="relative py-1 first:pt-0 last:pb-0">
          <div className="sticky top-0 z-20 flex justify-between items-center gap-2 bg-custom-background-100 select-none">
            <div className="font-medium text-xs text-custom-text-300 capitalize py-1">
              {filterKey.replaceAll("_", " ")}
            </div>
            <div
              className="flex-shrink-0 relative overflow-hidden w-5 h-5 rounded flex justify-center items-center cursor-pointer hover:bg-custom-background-80"
              onClick={() => handleFilterVisibility(filterKey)}
            >
              {!filterVisibility.includes(filterKey) ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </div>
          </div>
          {!filterVisibility.includes(filterKey) && (
            <ViewFiltersItemRoot
              workspaceSlug={workspaceSlug}
              projectId={projectId}
              viewId={viewId}
              viewType={viewType}
              filterKey={filterKey}
              dateCustomFilterToggle={dateCustomFilterToggle}
              setDateCustomFilterToggle={setDateCustomFilterToggle}
              isLocalView={isLocalView}
            />
          )}
        </div>
      ))}
    </div>
  );
});
