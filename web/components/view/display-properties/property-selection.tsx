import { FC, useCallback } from "react";
import { observer } from "mobx-react-lite";
// hooks
import { useViewDetail } from "hooks/store";
// types
import { TViewDisplayProperties, TViewTypes } from "@plane/types";

type TViewDisplayPropertySelection = {
  workspaceSlug: string;
  projectId: string | undefined;
  viewId: string;
  viewType: TViewTypes;
  property: keyof TViewDisplayProperties;
};

export const ViewDisplayPropertySelection: FC<TViewDisplayPropertySelection> = observer((props) => {
  const { workspaceSlug, projectId, viewId, viewType, property } = props;
  // hooks
  const viewDetailStore = useViewDetail(workspaceSlug, projectId, viewId, viewType);

  const handlePropertySelection = useCallback(
    () => viewDetailStore?.setDisplayProperties(property),
    [viewDetailStore, property]
  );

  const propertyIsSelected = viewDetailStore?.appliedFilters?.display_properties?.[property];

  return (
    <div
      className={`relative flex items-center gap-1 text-xs rounded p-0.5 px-2 border transition-all capitalize cursor-pointer
        ${
          propertyIsSelected
            ? `border-custom-primary-100 bg-custom-primary-100`
            : `border-custom-border-300 hover:bg-custom-background-80`
        }`}
      onClick={handlePropertySelection}
    >
      {["key"].includes(property) ? "ID" : property.replaceAll("_", " ")}
    </div>
  );
});
