"use client";

import { observer } from "mobx-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { MessageCircle } from "lucide-react";
// plane imports
import { Tooltip } from "@plane/ui";
import { cn } from "@plane/utils";
// hooks
import { useQueryParams } from "@/hooks/use-query-params";
// plane web hooks
import { EPageStoreType, usePageStore } from "@/plane-web/hooks/store";
// store
import { TPageInstance } from "@/store/pages/base-page";

type TPageCommentControlProps = {
  page: TPageInstance;
  storeType: EPageStoreType;
};

export const PageCommentControl: React.FC<TPageCommentControlProps> = observer((props) => {
  const { page: _page, storeType } = props;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { updateQueryParams } = useQueryParams();
  const { workspaceSlug } = useParams();
  const { isCommentsEnabled: canShowComments } = usePageStore(storeType);

  const isCommentsOpen = searchParams.get("paneTab") === "comments";

  if (!canShowComments(workspaceSlug.toString())) return null;

  const handleCommentsClick = () => {
    let newRoute: string;
    if (isCommentsOpen) {
      // If comments are open, remove the paneTab parameter to close
      newRoute = updateQueryParams({
        paramsToRemove: ["paneTab"],
      });
    } else {
      // If comments are closed, set paneTab to comments to open
      newRoute = updateQueryParams({
        paramsToAdd: { paneTab: "comments" },
      });
    }

    router.push(newRoute);
  };

  return (
    <Tooltip tooltipContent={isCommentsOpen ? "Close comments" : "Open comments"} position="bottom">
      <button
        type="button"
        onClick={handleCommentsClick}
        className={cn(
          "flex-shrink-0 size-6 grid place-items-center rounded transition-colors duration-200 ease",
          isCommentsOpen
            ? "text-custom-text-100 bg-custom-background-80"
            : "text-custom-text-200 hover:text-custom-text-100 hover:bg-custom-background-80"
        )}
        aria-label={isCommentsOpen ? "Close comments" : "Open comments"}
      >
        <MessageCircle className="size-3.5" />
      </button>
    </Tooltip>
  );
});
