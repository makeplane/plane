"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { FolderOutput } from "lucide-react";
// ui components
import { Tooltip } from "@plane/ui";
// core imports
import { TPageMoveControlProps } from "@/ce/components/pages/header/move-control";
// plane web hooks
import { usePageFlag } from "@/plane-web/hooks/use-page-flag";
// local imports
import { MovePageModal } from "../modals";

export const PageMoveControl = observer((props: TPageMoveControlProps) => {
  const { page } = props;
  // states
  const [isMovePageModalOpen, setIsMovePageModalOpen] = useState(false);
  // navigation
  const { workspaceSlug } = useParams();
  // derived values
  const { canCurrentUserMovePage } = page;
  // page flag
  const { isMovePageEnabled } = usePageFlag({
    workspaceSlug: workspaceSlug?.toString() ?? "",
  });

  if (!isMovePageEnabled || !canCurrentUserMovePage) return null;

  return (
    <>
      <MovePageModal isOpen={isMovePageModalOpen} onClose={() => setIsMovePageModalOpen(false)} page={page} />
      <Tooltip tooltipContent="Move page" position="bottom">
        <button
          type="button"
          onClick={() => setIsMovePageModalOpen(true)}
          className="flex-shrink-0 size-6 grid place-items-center rounded text-custom-text-200 hover:text-custom-text-100 hover:bg-custom-background-80 transition-colors"
        >
          <FolderOutput className="size-3.5" />
        </button>
      </Tooltip>
    </>
  );
});
