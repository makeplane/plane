import React from "react";
import { forwardRef } from "react";
import { MoreVertical } from "lucide-react";

interface IDragHandle {
  isDragging: boolean;
  disabled?: boolean;
}

export const DragHandle = forwardRef<HTMLButtonElement | null, IDragHandle>((props, ref) => {
  const { isDragging, disabled = false } = props;

  if (disabled) {
    return <div className="w-[14px] h-[18px]" />;
  }

  return (
    <button
      type="button"
      className={` p-[2px] flex flex-shrink-0 rounded bg-custom-background-90 text-custom-sidebar-text-200 group-hover:opacity-100 cursor-grab ${
        isDragging ? "opacity-100" : "opacity-0"
      }`}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      ref={ref}
    >
      <MoreVertical className="h-3.5 w-3.5 stroke-custom-text-400" />
      <MoreVertical className="-ml-5 h-3.5 w-3.5 stroke-custom-text-400" />
    </button>
  );
});

DragHandle.displayName = "DragHandle";
