import { FC, Fragment } from "react";
import { observer } from "mobx-react-lite";
import isEmpty from "lodash/isEmpty";
import { X } from "lucide-react";
// hooks
import { useViewDetail } from "hooks/store";
// components
import { ViewAppliedFiltersItem } from "./filter-item";
// types
import { TViewFilters, TViewTypes } from "@plane/types";
import { TViewOperations } from "../types";

type TViewAppliedFilters = {
  workspaceSlug: string;
  projectId: string | undefined;
  viewId: string;
  viewType: TViewTypes;
  filterKey: keyof TViewFilters;
  viewOperations: TViewOperations;
};

export const ViewAppliedFilters: FC<TViewAppliedFilters> = observer((props) => {
  const { workspaceSlug, projectId, viewId, viewType, filterKey, viewOperations } = props;

  const viewDetailStore = useViewDetail(workspaceSlug, projectId, viewId, viewType);

  const propertyValues =
    viewDetailStore?.appliedFilters?.filters && !isEmpty(viewDetailStore?.appliedFilters?.filters)
      ? viewDetailStore?.appliedFilters?.filters?.[filterKey] || undefined
      : undefined;

  const clearPropertyFilter = () => viewDetailStore?.setFilters(filterKey, "clear_all");

  if (!propertyValues || propertyValues.length <= 0) return <></>;
  return (
    <div className="relative flex items-center gap-2 border border-custom-border-300 rounded p-1.5 px-2 min-h-[32px]">
      <div className="flex-shrink-0 text-xs text-custom-text-200 capitalize">{filterKey.replaceAll("_", " ")}</div>
      <div className="relative flex items-center gap-1.5 flex-wrap">
        {propertyValues.length >= 100 ? (
          <div className="text-xs font-medium bg-custom-primary-100/20 rounded relative flex items-center gap-1 p-1 px-2">
            {propertyValues.length} {filterKey.replaceAll("_", " ")}s
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
                  viewOperations={viewOperations}
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
