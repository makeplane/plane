"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { MessageSquareText } from "lucide-react";
import { Tooltip } from "@plane/propel/tooltip";
import { cn } from "@plane/ui";
// plane web hooks
import { EPageStoreType, usePageStore } from "@/plane-web/hooks/store";
// hooks
import { usePaneTabToggle } from "@/plane-web/hooks/use-pane-tab-toggle";
// store
import { TPageInstance } from "@/store/pages/base-page";

type TPageCommentControlProps = {
  page: TPageInstance;
  storeType: EPageStoreType;
};

export const PageCommentControl: React.FC<TPageCommentControlProps> = observer((props) => {
  const { storeType } = props;
  const { workspaceSlug } = useParams();
  const { isCommentsEnabled: canShowComments } = usePageStore(storeType);
  const { isActive, toggle } = usePaneTabToggle("comments");

  if (!canShowComments(workspaceSlug.toString())) return null;

  return (
    <Tooltip tooltipContent={isActive ? "Close comments" : "Open comments"} position="bottom">
      <button
        type="button"
        onClick={toggle}
        className={cn(
          "flex items-center justify-center h-6 w-6 rounded text-custom-text-200 hover:text-custom-text-100 hover:bg-custom-background-80 transition-colors duration-200",
          { "bg-custom-background-80 text-custom-text-100": isActive }
        )}
        aria-label={isActive ? "Close comments" : "Open comments"}
      >
        <MessageSquareText className="h-3.5 w-3.5" />
      </button>
    </Tooltip>
  );
});
