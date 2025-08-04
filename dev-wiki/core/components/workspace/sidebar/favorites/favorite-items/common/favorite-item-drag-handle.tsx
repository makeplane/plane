"use client";
import React, { FC } from "react";
import { observer } from "mobx-react";
// ui
import { DragHandle, Tooltip } from "@plane/ui";
// helper
import { cn } from "@/helpers/common.helper";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";

type Props = {
  sort_order: number | null;
  isDragging: boolean;
};

export const FavoriteItemDragHandle: FC<Props> = observer((props) => {
  const { sort_order, isDragging } = props;
  // store hooks
  const { isMobile } = usePlatformOS();

  return (
    <Tooltip
      isMobile={isMobile}
      tooltipContent={sort_order === null ? "Join the project to rearrange" : "Drag to rearrange"}
      position="top-right"
      disabled={isDragging}
    >
      <div
        className={cn(
          "hidden group-hover/project-item:flex items-center justify-center absolute top-1/2 -left-3 -translate-y-1/2 rounded text-custom-sidebar-text-400 cursor-grab",
          {
            "cursor-not-allowed opacity-60": sort_order === null,
            "cursor-grabbing": isDragging,
          }
        )}
      >
        <DragHandle className="bg-transparent" />
      </div>
    </Tooltip>
  );
});
