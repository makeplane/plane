import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Plus, X } from "lucide-react";
// plane ui
import { RecentStickyIcon } from "@plane/ui";
// hooks
import { useSticky } from "@/hooks/use-stickies";
// components
import { StickiesTruncated } from "../layout/stickies-truncated";
import { useStickyOperations } from "../sticky/use-operations";
import { StickySearch } from "./search";

type TProps = {
  handleClose?: () => void;
};

export const Stickies = observer((props: TProps) => {
  const { handleClose } = props;
  // navigation
  const { workspaceSlug } = useParams();
  // store hooks
  const { creatingSticky, toggleShowNewSticky } = useSticky();
  // sticky operations
  const { stickyOperations } = useStickyOperations({ workspaceSlug: workspaceSlug?.toString() });

  return (
    <div className="p-6 pb-0 min-h-[620px]">
      {/* header */}
      <div className="flex items-center justify-between mb-6">
        {/* Title */}
        <div className="text-custom-text-200 flex items-center gap-2">
          <RecentStickyIcon className="size-5 rotate-90 flex-shrink-0" />
          <p className="text-xl font-medium">Your stickies</p>
        </div>
        {/* actions */}
        <div className="flex gap-2">
          <StickySearch />
          <button
            onClick={() => {
              toggleShowNewSticky(true);
              stickyOperations.create();
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
          {handleClose && (
            <button
              type="button"
              onClick={handleClose}
              className="flex-shrink-0 grid place-items-center text-custom-text-300 hover:text-custom-text-100 hover:bg-custom-background-80 rounded p-1 transition-colors my-auto"
            >
              <X className="text-custom-text-400 size-4" />
            </button>
          )}
        </div>
      </div>
      {/* content */}
      <div className="mb-4 max-h-[625px] overflow-scroll">
        <StickiesTruncated handleClose={handleClose} />
      </div>
    </div>
  );
});
