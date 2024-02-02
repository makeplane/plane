import { FC } from "react";
import { observer } from "mobx-react-lite";
import isEmpty from "lodash/isEmpty";
import { X } from "lucide-react";
// hooks
import { useViewDetail } from "hooks/store";
// helpers
import { generateTitle } from "./helper";
// types
import { TFilters } from "@plane/types";

type TViewAppliedFilters = {
  workspaceSlug: string;
  projectId: string | undefined;
  viewId: string;
  filterKey: keyof TFilters;
};

export const ViewAppliedFilters: FC<TViewAppliedFilters> = observer((props) => {
  const { workspaceSlug, projectId, viewId, filterKey } = props;

  const view = useViewDetail("WORKSPACE", workspaceSlug, projectId, viewId);

  const filterKeyValue =
    view?.appliedFilters?.filters && !isEmpty(view?.appliedFilters?.filters)
      ? view?.appliedFilters?.filters?.[filterKey] || undefined
      : undefined;

  if (!filterKeyValue || filterKeyValue.length <= 0) return <></>;
  return (
    <div key={filterKey} className="relative flex items-center gap-2 border border-custom-border-300 rounded p-1.5">
      <div className="flex-shrink-0 text-xs">{generateTitle(filterKey)}</div>
      <div className="border border-red-500 relative flex items-center">
        {/* <div className="relative flex items-center">
            <div>Icon</div>
            <div>Title</div>
            <div>Close</div>
          </div>

          <div>
            <div>Icon</div>
            <div>Title</div>
            <div>Close</div>
          </div> */}
      </div>
      <div className="flex-shrink-0 relative flex justify-center items-center w-4 h-4 rounded-full cursor-pointer transition-all bg-custom-background-80 hover:bg-custom-background-90 text-custom-text-300 hover:text-custom-text-200">
        <X size={10} />
      </div>
    </div>
  );
});
