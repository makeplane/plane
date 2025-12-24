import React from "react";
import { observer } from "mobx-react";
// ui
import { Tooltip } from "@plane/propel/tooltip";
import { DragHandle } from "@plane/ui";
// helper
import { cn } from "@plane/utils";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";

type Props = {
  sort_order: number | null;
  isDragging: boolean;
};

export const FavoriteItemDragHandle = observer(function FavoriteItemDragHandle(props: Props) {
  const { sort_order, isDragging } = props;
  // store hooks
  const { isMobile } = usePlatformOS();

  return (
    <Tooltip
      isMobile={isMobile}
      tooltipContent={sort_order === null ? "Join the project to rearrange" : "Drag to rearrange"}
      position="top-end"
      disabled={isDragging}
    >
      <div
        className={cn(
          "hidden group-hover/project-item:flex items-center justify-center absolute top-1/2 -left-3 -translate-y-1/2 rounded-sm text-placeholder cursor-grab",
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
