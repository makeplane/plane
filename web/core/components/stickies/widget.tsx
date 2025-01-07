import { useParams } from "next/navigation";
import { Plus } from "lucide-react";
import { useSticky } from "@/hooks/use-stickies";
import { STICKY_COLORS } from "../editor/sticky-editor/color-pallete";
import { StickySearch } from "./modal/search";
import { StickiesLayout } from "./stickies-layout";
import { useStickyOperations } from "./sticky/use-operations";

export const StickiesWidget = () => {
  const { workspaceSlug } = useParams();
  const { creatingSticky, toggleShowNewSticky } = useSticky();
  const { stickyOperations } = useStickyOperations({ workspaceSlug: workspaceSlug?.toString() });
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="text-base font-semibold text-custom-text-350">My Stickies </div>
        {/* actions */}
        <div className="flex gap-2">
          <StickySearch />
          <button
            onClick={() => {
              toggleShowNewSticky(true);
              stickyOperations.create({ color: STICKY_COLORS[0] });
            }}
            className="flex gap-1 text-sm font-medium text-custom-primary-100 my-auto"
            disabled={creatingSticky}
          >
            <Plus className="size-4 my-auto" /> <span>Add sticky</span>
            {creatingSticky && (
              <div className="flex items-center justify-center ml-2">
                <div
                  className={`w-4 h-4 border-2 border-t-transparent rounded-full animate-spin border-custom-primary-100`}
                  role="status"
                  aria-label="loading"
                />
              </div>
            )}
          </button>
        </div>
      </div>
      <div className="-mx-2">
        <StickiesLayout />
      </div>
    </div>
  );
};
