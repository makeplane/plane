import { FC, Fragment } from "react";
import { observer } from "mobx-react-lite";
import { X } from "lucide-react";
import isEmpty from "lodash/isEmpty";
// hooks
import { useViewDetail } from "hooks/store";
// components
import { ViewAppliedFilters } from "./filter";
// types
import { TViewTypes, TViewFilters } from "@plane/types";
import { TViewOperations } from "../types";

type TViewAppliedFiltersRoot = {
  workspaceSlug: string;
  projectId: string | undefined;
  viewId: string;
  viewType: TViewTypes;
  viewOperations: TViewOperations;
};

export const ViewAppliedFiltersRoot: FC<TViewAppliedFiltersRoot> = observer((props) => {
  const { workspaceSlug, projectId, viewId, viewType, viewOperations } = props;
  // hooks
  const viewDetailStore = useViewDetail(workspaceSlug, projectId, viewId, viewType);

  const filterKeys =
    viewDetailStore?.appliedFilters && !isEmpty(viewDetailStore?.appliedFilters?.filters)
      ? Object.keys(viewDetailStore?.appliedFilters?.filters)
      : undefined;

  const clearAllFilters = () => viewDetailStore?.setFilters(undefined, "clear_all");

  if (!filterKeys || !viewDetailStore?.isFiltersApplied)
    return (
      <div className="relative w-full text-sm text-custom-text-200 inline-block truncate line-clamp-1 pt-1.5">
        No filters applied. Apply filters to create views.
      </div>
    );
  return (
    <div className="relative flex items-center gap-2 flex-wrap">
      {filterKeys.map((key) => {
        const filterKey = key as keyof TViewFilters;
        return (
          <Fragment key={filterKey}>
            <ViewAppliedFilters
              workspaceSlug={workspaceSlug}
              projectId={projectId}
              viewId={viewId}
              viewType={viewType}
              filterKey={filterKey}
              viewOperations={viewOperations}
            />
          </Fragment>
        );
      })}

      <div
        className="relative flex items-center gap-2 border border-custom-border-300 rounded p-1.5 px-2 cursor-pointer transition-all hover:bg-custom-background-80 text-custom-text-200 hover:text-custom-text-100 min-h-[36px]"
        onClick={clearAllFilters}
      >
        <div className="text-xs">Clear All</div>
        <div className="flex-shrink-0 relative flex justify-center items-center w-4 h-4">
          <X size={10} />
        </div>
      </div>
    </div>
  );
});
