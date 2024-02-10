import { FC } from "react";
import { ChevronDown } from "lucide-react";
import { observer } from "mobx-react-lite";
// hooks
import { useViewDetail } from "hooks/store";
// components
// types
import { TViewTypes } from "@plane/types";
import { TViewOperations } from "../types";

type TViewEditDropdown = {
  workspaceSlug: string;
  projectId: string | undefined;
  viewId: string;
  viewType: TViewTypes;
  viewOperations: TViewOperations;
};

export const ViewEditDropdown: FC<TViewEditDropdown> = observer((props) => {
  const { workspaceSlug, projectId, viewId, viewType, viewOperations } = props;
  // hooks
  const viewDetailStore = useViewDetail(workspaceSlug, projectId, viewId, viewType);

  if (!viewDetailStore?.isFiltersUpdateEnabled) return <></>;
  return (
    <>
      <div className=" relative flex items-center rounded h-7 transition-all cursor-pointer bg-custom-primary-100/20 text-custom-primary-100">
        <button
          className="text-sm px-3 font-medium h-full border-r border-white/50 flex justify-center items-center rounded-l transition-all hover:bg-custom-primary-100/30"
          disabled={viewDetailStore?.loader === "filters_submitting"}
          onClick={() => viewOperations.update()}
        >
          Update
        </button>
        <div className="flex-shrink-0 px-1.5 hover:bg-custom-primary-100/30 h-full flex justify-center items-center rounded-r transition-all">
          <ChevronDown size={16} />
        </div>
      </div>
    </>
  );
});
