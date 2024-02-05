import { FC } from "react";
import { observer } from "mobx-react-lite";
import isEmpty from "lodash/isEmpty";
import { X } from "lucide-react";
// hooks
import { useViewDetail } from "hooks/store";
// components
import { ViewAppliedFiltersItem } from "./filter-item";
// helpers
import { generateTitle } from "./helper";
// types
import { TViewFilters, TViewTypes } from "@plane/types";

type TViewAppliedFilters = {
  workspaceSlug: string;
  projectId: string | undefined;
  viewId: string;
  viewType: TViewTypes;
  filterKey: keyof TViewFilters;
};

export const ViewAppliedFilters: FC<TViewAppliedFilters> = observer((props) => {
  const { workspaceSlug, projectId, viewId, viewType, filterKey } = props;

  const viewDetailStore = useViewDetail(workspaceSlug, projectId, viewId, viewType);

  const filterKeyValue =
    viewDetailStore?.appliedFilters?.filters && !isEmpty(viewDetailStore?.appliedFilters?.filters)
      ? viewDetailStore?.appliedFilters?.filters?.[filterKey] || undefined
      : undefined;

  const clearFilter = () => viewDetailStore?.setFilters({ [filterKey]: [] });

  if (!filterKeyValue || filterKeyValue.length <= -1) return <></>;
  return (
    <div
      key={filterKey}
      className="relative flex items-center gap-2 border border-custom-border-300 rounded p-1.5 py-1 min-h-[32px]"
    >
      <div className="flex-shrink-0 text-xs text-custom-text-200">{generateTitle(filterKey)}</div>
      <div className="relative flex items-center gap-1 flex-wrap">
        {["1", "2", "3", "4"].map((filterId) => (
          <ViewAppliedFiltersItem
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            viewId={viewId}
            viewType={viewType}
            filterKey={filterKey}
            filterId={filterId}
          />
        ))}
      </div>
      <div
        className="flex-shrink-0 relative flex justify-center items-center w-4 h-4 rounded-full cursor-pointer transition-all bg-custom-background-80 hover:bg-custom-background-90 text-custom-text-300 hover:text-custom-text-200"
        onClick={clearFilter}
      >
        <X size={10} />
      </div>
    </div>
  );
});
