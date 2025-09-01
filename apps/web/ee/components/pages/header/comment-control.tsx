"use client";

import { observer } from "mobx-react";
import { useRouter, useSearchParams } from "next/navigation";
import { MessageCircle } from "lucide-react";
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
  const { isCommentsEnabled: canShowComments } = usePageStore(storeType);
  const searchParams = useSearchParams();
  const { updateQueryParams } = useQueryParams();

  if (!canShowComments) return null;

  const handleCommentsClick = () => {
    const currentPaneTab = searchParams.get("paneTab");

    let newRoute: string;
    if (currentPaneTab === "comments") {
      // If comments pane is open, close it by removing the parameter
      newRoute = updateQueryParams({
        paramsToRemove: ["paneTab"],
      });
    } else {
      // If comments pane is closed or on a different tab, open comments
      newRoute = updateQueryParams({
        paramsToAdd: { paneTab: "comments" },
      });
    }

    router.push(newRoute);
  };

  return (
    <button
      onClick={handleCommentsClick}
      className="flex items-center justify-center h-6 w-6 rounded text-custom-text-300 hover:text-custom-text-200 hover:bg-custom-background-80 transition-colors duration-200"
      title="Comments"
    >
      <MessageCircle className="h-3.5 w-3.5" />
    </button>
  );
});
