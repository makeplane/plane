import { observer } from "mobx-react";
import { useParams } from "next/navigation";

// plane imports
import { useTranslation } from "@plane/i18n";
import { PlusIcon } from "@plane/propel/icons";
// hooks
import { useSticky } from "@/hooks/use-stickies";
// local imports
import { StickiesTruncated } from "./layout/stickies-truncated";
import { StickySearch } from "./modal/search";
import { useStickyOperations } from "./sticky/use-operations";

export const StickiesWidget = observer(function StickiesWidget() {
  // params
  const { workspaceSlug } = useParams();
  // store hooks
  const { creatingSticky, toggleShowNewSticky } = useSticky();
  const { t } = useTranslation();
  // sticky operations
  const { stickyOperations } = useStickyOperations({
    workspaceSlug: workspaceSlug?.toString() ?? "",
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="text-14 font-semibold text-tertiary">{t("stickies.title")}</div>
        {/* actions */}
        <div className="flex gap-2">
          <StickySearch />
          <button
            onClick={() => {
              toggleShowNewSticky(true);
              stickyOperations.create();
            }}
            className="flex gap-1 text-13 font-medium text-accent-primary my-auto"
            disabled={creatingSticky}
          >
            <PlusIcon className="size-4 my-auto" />
            <span>{t("stickies.add")}</span>
            {creatingSticky && (
              <div
                className="size-4 border-2 border-t-transparent border-accent-strong rounded-full animate-spin"
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
