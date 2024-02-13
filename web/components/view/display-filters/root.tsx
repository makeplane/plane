import { FC, useState } from "react";
import { observer } from "mobx-react-lite";
import { ChevronUp, ChevronDown } from "lucide-react";
import filter from "lodash/filter";
import concat from "lodash/concat";
import uniq from "lodash/uniq";
// hooks
import { useViewDetail } from "hooks/store";
// components
import { ViewDisplayPropertiesRoot, ViewDisplayFiltersItemRoot } from "../";
// types
import { TViewDisplayFilters, TViewTypes } from "@plane/types";
// constants
import { EViewPageType, viewDefaultFilterParametersByViewTypeAndLayout } from "constants/view";

type TViewDisplayFiltersRoot = {
  workspaceSlug: string;
  projectId: string | undefined;
  viewId: string;
  viewType: TViewTypes;
  viewPageType: EViewPageType;
};

export const ViewDisplayFiltersRoot: FC<TViewDisplayFiltersRoot> = observer((props) => {
  const { workspaceSlug, projectId, viewId, viewType, viewPageType } = props;
  // hooks
  const viewDetailStore = useViewDetail(workspaceSlug, projectId, viewId, viewType);
  // state
  const [filterVisibility, setFilterVisibility] = useState<(Partial<keyof TViewDisplayFilters> | "display_property")[]>(
    []
  );
  const handleFilterVisibility = (key: keyof TViewDisplayFilters | "display_property") => {
    setFilterVisibility((prevData = []) => {
      if (prevData.includes(key)) return filter(prevData, (item) => item !== key);
      return uniq(concat(prevData, [key]));
    });
  };

  const layout = viewDetailStore?.appliedFilters?.display_filters?.layout;

  const filtersProperties = layout
    ? viewDefaultFilterParametersByViewTypeAndLayout(viewPageType, layout, "display_filters")
    : [];

  return (
    <div className="space-y-1 divide-y divide-custom-border-300">
      <div className="relative py-1 first:pt-0">
        <div className="sticky top-0 z-20 flex justify-between items-center gap-2 bg-custom-background-100 select-none">
          <div className="font-medium text-xs text-custom-text-300 capitalize py-1">Properties</div>
          <div
            className="flex-shrink-0 relative overflow-hidden w-5 h-5 rounded flex justify-center items-center cursor-pointer hover:bg-custom-background-80"
            onClick={() => handleFilterVisibility("display_property")}
          >
            {!filterVisibility.includes("display_property") ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </div>
        </div>
        {!filterVisibility.includes("display_property") && (
          <div className="py-1">
            <ViewDisplayPropertiesRoot
              workspaceSlug={workspaceSlug}
              projectId={projectId}
              viewId={viewId}
              viewType={viewType}
            />
          </div>
        )}
      </div>

      {filtersProperties.map((filterKey) => (
        <div key={filterKey} className="relative py-1 last:pb-0">
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
            <ViewDisplayFiltersItemRoot
              workspaceSlug={workspaceSlug}
              projectId={projectId}
              viewId={viewId}
              viewType={viewType}
              filterKey={filterKey}
            />
          )}
        </div>
      ))}

      {/* extra options */}
      <div>
        <div>Show sub issues</div>
        <div>Show Empty groups</div>
      </div>
    </div>
  );
});
