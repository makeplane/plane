import { FC } from "react";
import { observer } from "mobx-react-lite";
import isEmpty from "lodash/isEmpty";
// hooks
import { useViewDetail } from "hooks/store";
// components
import { ViewAppliedFilters } from "./filter";
// types
import { TFilters } from "@plane/types";
import { TViewOperations } from "../types";

type TViewAppliedFiltersRoot = {
  workspaceSlug: string;
  projectId: string | undefined;
  viewId: string;
  viewOperations: TViewOperations;
};

export const ViewAppliedFiltersRoot: FC<TViewAppliedFiltersRoot> = observer((props) => {
  const { workspaceSlug, projectId, viewId } = props;
  // hooks
  const view = useViewDetail("WORKSPACE", workspaceSlug, projectId, viewId);

  const filterKeys =
    view?.appliedFilters && !isEmpty(view?.appliedFilters?.filters)
      ? Object.keys(view?.appliedFilters?.filters)
      : undefined;

  if (!filterKeys) return <></>;
  return (
    <div className="relative flex items-center gap-2 flex-wrap border border-red-500 p-4">
      {filterKeys.map((key) => {
        const filterKey = key as keyof TFilters;
        return (
          <ViewAppliedFilters
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            viewId={viewId}
            filterKey={filterKey}
          />
        );
      })}
    </div>
  );
});
