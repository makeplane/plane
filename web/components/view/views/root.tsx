import { FC } from "react";
import { ChevronRight } from "lucide-react";
// types
import { TViewOperations } from "../types";
import { TViewTypes } from "@plane/types";

type TViewRoot = {
  workspaceSlug: string;
  projectId: string | undefined;
  viewId: string | undefined;
  viewType: TViewTypes;
  viewOperations: TViewOperations;
};

export const ViewRoot: FC<TViewRoot> = (props) => {
  const {} = props;

  return (
    <div className="border border-red-500 relative flex items-center gap-2">
      {/* header */}
      <div className="">Workspace Views</div>
      {/* divider */}
      <div className="relative w-[50px] h-[50px] flex justify-center items-center">
        <div className="absolute top-0 bottom-0 border border-red-500 w-[0.5px]" />
        <div className="flex-shrink-0 w-4 h-4 relative flex justify-center items-center rounded-full bg-red-500">
          <ChevronRight size={12} />
        </div>
      </div>
      {/* views content */}
      <div className=" relative flex items-center">
        <div>Icon</div>
        <div>Title</div>
      </div>
    </div>
  );
};
