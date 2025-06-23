"use client";
import React, { FC } from "react";
import { observer } from "mobx-react";
// ui
import { DragHandle } from "@plane/ui";
// helper
import { cn } from "@plane/utils";

type Props = {
  sort_order: number | null;
  isDragging: boolean;
};

export const WidgetItemDragHandle: FC<Props> = observer((props) => {
  const { isDragging } = props;

  return (
    <div
      className={cn("flex items-center justify-center rounded text-custom-sidebar-text-400 cursor-grab mr-2", {
        "cursor-grabbing": isDragging,
      })}
    >
      <DragHandle className="bg-transparent" />
    </div>
  );
});
