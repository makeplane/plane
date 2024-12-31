import { useState } from "react";
import { Plus, X } from "lucide-react";
import { RecentStickyIcon } from "@plane/ui";
import { useSticky } from "@/plane-web/hooks/use-stickies";
import { StickiesLayout } from "../stickies-layout";
import { StickySearch } from "./search";

type TProps = {
  handleClose?: () => void;
};

export const Stickies = (props: TProps) => {
  const { handleClose } = props;
  const { updateActiveStickyId, toggleShowNewSticky } = useSticky();

  return (
    <div className="p-6 pb-0">
      {/* header */}
      <div className="flex items-center justify-between mb-6">
        {/* Title */}
        <div className="text-custom-text-100 flex gap-2">
          <RecentStickyIcon className="size-5 rotate-90" />
          <p className="text-lg font-medium">My Stickies</p>
        </div>
        {/* actions */}
        <div className="flex gap-2">
          <StickySearch />
          <button
            onClick={() => {
              updateActiveStickyId(undefined);
              toggleShowNewSticky(true);
            }}
            className="flex gap-1 text-sm font-medium text-custom-primary-100 my-auto"
          >
            <Plus className="size-4 my-auto" /> <span>Add sticky</span>
          </button>
          {handleClose && (
            <button
              onClick={handleClose}
              className="flex-shrink-0 grid place-items-center text-custom-text-300 hover:text-custom-text-100 transition-colors my-auto"
            >
              <X className="text-custom-text-400 size-4" />
            </button>
          )}
        </div>
      </div>
      {/* content */}
      <StickiesLayout />
    </div>
  );
};
