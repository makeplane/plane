import { FC, Fragment, useCallback, useMemo } from "react";
import { observer } from "mobx-react-lite";
import { Check } from "lucide-react";
// hooks
import { useViewDetail } from "hooks/store";
// types
import { TViewDisplayFiltersExtraOptions, TViewTypes } from "@plane/types";
// constants
import { EXTRA_OPTIONS_PROPERTY } from "constants/view";

type TDisplayFilterExtraOptions = {
  workspaceSlug: string;
  projectId: string | undefined;
  viewId: string;
  viewType: TViewTypes;
  filterKey: TViewDisplayFiltersExtraOptions;
};

export const DisplayFilterExtraOptions: FC<TDisplayFilterExtraOptions> = observer((props) => {
  const { workspaceSlug, projectId, viewId, viewType, filterKey } = props;
  // hooks
  const viewDetailStore = useViewDetail(workspaceSlug, projectId, viewId, viewType);

  const optionTitle = useMemo(() => EXTRA_OPTIONS_PROPERTY[filterKey].label, [filterKey]);

  const isSelected = viewDetailStore?.appliedFilters?.display_filters?.[filterKey] ? true : false;

  const handlePropertySelection = useCallback(
    () => viewDetailStore?.setDisplayFilters({ [filterKey]: !isSelected }),
    [viewDetailStore, filterKey, isSelected]
  );

  return (
    <Fragment>
      <div
        className="relative w-full flex items-center overflow-hidden gap-2.5 cursor-pointer p-1 py-1.5 rounded hover:bg-custom-background-80 transition-all group"
        onClick={handlePropertySelection}
      >
        <div
          className={`flex-shrink-0 w-3 h-3 flex justify-center items-center border rounded text-bold ${
            isSelected
              ? "border-custom-primary-100 bg-custom-primary-100"
              : "border-custom-border-400 bg-custom-background-100"
          }`}
        >
          {isSelected && <Check size={14} />}
        </div>
        <div className="text-xs block truncate line-clamp-1 text-custom-text-200 group-hover:text-custom-text-100">
          {optionTitle || "Extra Option"}
        </div>
      </div>
    </Fragment>
  );
});
