"use client";
import React, { FC } from "react";
import { observer } from "mobx-react";
// ui
import { DragHandle } from "@plane/ui";
// helper
import { cn } from "@plane/utils";

type Props = {
  isDragging: boolean;
};

export const StickyItemDragHandle: FC<Props> = observer((props) => {
  const { isDragging } = props;

  return (
    <div
      className={cn(
        "hidden group-hover/sticky:flex absolute top-3 left-1/2 -translate-x-1/2 items-center justify-center rounded text-custom-sidebar-text-400 cursor-grab mr-2 rotate-90",
        {
          "cursor-grabbing": isDragging,
        }
      )}
    >
      <DragHandle className="bg-transparent" />
    </div>
  );
});
