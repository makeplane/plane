import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { FilePlus2 } from "lucide-react";
// plane imports
import { WORKSPACE_PAGE_TRACKER_EVENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EPageAccess, TPage } from "@plane/types";
import { setToast, TOAST_TYPE } from "@plane/ui";
import { cn } from "@plane/utils";
import { captureError, captureSuccess } from "@/helpers/event-tracker.helper";
import { useAppRouter } from "@/hooks/use-app-router";
import { EPageStoreType, usePageStore } from "@/plane-web/hooks/store/use-page-store";
import { AppSearch } from "../../workspace/sidebar/app-search";
// plane web components

export const PagesAppSidebarQuickActions = observer(() => {
  // states
  const [isCreatingPage, setIsCreatingPage] = useState(false);
  // params
  const { workspaceSlug } = useParams();
  const router = useAppRouter();
  // hooks
  const { createPage } = usePageStore(EPageStoreType.WORKSPACE);
  const { t } = useTranslation();
  // handlers
  const handleCreatePage = async () => {
    setIsCreatingPage(true);
    const payload: Partial<TPage> = {
      access: EPageAccess.PUBLIC,
    };

    await createPage(payload)
      .then((res) => {
        if (res?.id) {
          captureSuccess({
            eventName: WORKSPACE_PAGE_TRACKER_EVENTS.create,
            payload: {
              id: res?.id,
              state: "SUCCESS",
            },
          });
          const pageId = `/${workspaceSlug}/pages/${res?.id}`;
          router.push(pageId);
        }
      })
      .catch((err) => {
        captureError({
          eventName: WORKSPACE_PAGE_TRACKER_EVENTS.create,
          payload: {
            state: "ERROR",
            error: err?.data?.error,
          },
        });
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: err?.data?.error || "Page could not be created. Please try again.",
        });
      })
      .finally(() => setIsCreatingPage(false));
  };
  return (
    <div className="flex items-center justify-between gap-1 cursor-pointer">
      <button
        type="button"
        className={cn(
          "flex-grow text-custom-text-300 text-sm font-medium border-[0.5px] border-custom-sidebar-border-300 text-left rounded h-8 px-3 flex items-center gap-2",
          !isCreatingPage && "hover:bg-custom-sidebar-background-90"
        )}
        onClick={handleCreatePage}
        disabled={isCreatingPage}
      >
        <FilePlus2 className="size-4" />
        {isCreatingPage ? t("common.creating") : `New page`}
      </button>

      <AppSearch />
    </div>
  );
});
