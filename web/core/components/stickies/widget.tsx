import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Plus } from "lucide-react";
// hooks
import { useSticky } from "@/hooks/use-stickies";
import { StickiesTruncated } from "./layout";
import { StickySearch } from "./modal/search";
import { useStickyOperations } from "./sticky/use-operations";

export const StickiesWidget: React.FC = observer(() => {
  // params
  const { workspaceSlug } = useParams();
  // store hooks
  const { creatingSticky, toggleShowNewSticky } = useSticky();
  // sticky operations
  const { stickyOperations } = useStickyOperations({
    workspaceSlug: workspaceSlug?.toString() ?? "",
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="text-base font-semibold text-custom-text-350">Your stickies</div>
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
            <Plus className="size-4 my-auto" />
            <span>Add sticky</span>
            {creatingSticky && (
              <div
                className="size-4 border-2 border-t-transparent border-custom-primary-100 rounded-full animate-spin"
                role="status"
                aria-label="loading"
              />
            )}
          </button>
        </div>
      </div>
      <div className="-mx-2">
        <StickiesTruncated />
      </div>
    </div>
  );
});
