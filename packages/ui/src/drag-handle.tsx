import React, { forwardRef } from "react";
import { MoreVertical } from "lucide-react";
// helpers
import { cn } from "../helpers";

interface IDragHandle {
  className?: string;
  disabled?: boolean;
}

export const DragHandle = forwardRef<HTMLButtonElement | null, IDragHandle>((props, ref) => {
  const { className, disabled = false } = props;

  if (disabled) {
    return <div className="w-[14px] h-[18px]" />;
  }

  return (
    <button
      type="button"
      className={cn(
        "p-0.5 flex flex-shrink-0 rounded bg-custom-background-90 text-custom-sidebar-text-200 cursor-grab",
        className
      )}
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
