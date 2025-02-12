import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Plus } from "lucide-react";
// hooks
import { useTranslation } from "@plane/i18n";
import { useSticky } from "@/hooks/use-stickies";
import { StickiesTruncated } from "./layout";
import { StickySearch } from "./modal/search";
import { useStickyOperations } from "./sticky/use-operations";

export const StickiesWidget: React.FC = observer(() => {
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
        <div className="text-base font-semibold text-custom-text-350">{t("stickies.title")}</div>
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
            <span>{t("stickies.add")}</span>
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
