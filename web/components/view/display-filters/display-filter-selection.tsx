import { FC } from "react";
import { Check } from "lucide-react";
import { observer } from "mobx-react-lite";
// hooks
import { useViewDetail } from "hooks/store";
// types
import { TViewDisplayFilters, TViewTypes } from "@plane/types";

type TViewDisplayFilterSelection = {
  workspaceSlug: string;
  projectId: string | undefined;
  viewId: string;
  viewType: TViewTypes;
  filterKey: keyof TViewDisplayFilters;
  propertyId: string;
};

export const ViewDisplayFilterSelection: FC<TViewDisplayFilterSelection> = observer((props) => {
  const { workspaceSlug, projectId, viewId, viewType, filterKey, propertyId } = props;

  const viewDetailStore = useViewDetail(workspaceSlug, projectId, viewId, viewType);

  const propertyIds = viewDetailStore?.appliedFilters?.display_filters?.[filterKey] || undefined;

  const isSelected = propertyIds === propertyId || false;

  return (
    <div
      className={`flex-shrink-0 w-3 h-3 flex justify-center items-center border rounded-full text-bold ${
        isSelected
          ? "border-custom-primary-100 bg-custom-primary-100"
          : "border-custom-border-400 bg-custom-background-100"
      }`}
    >
      {isSelected && <Check size={14} className="text-white" />}
    </div>
  );
});
