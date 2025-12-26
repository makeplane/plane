import { MoreVertical } from "lucide-react";
import React, { forwardRef } from "react";
// helpers
import { cn } from "./utils";

interface IDragHandle {
  className?: string;
  disabled?: boolean;
}

export const DragHandle = forwardRef(function DragHandle(
  props: IDragHandle,
  ref: React.ForwardedRef<HTMLButtonElement | null>
) {
  const { className, disabled = false } = props;

  if (disabled) {
    return <div className="w-[14px] h-[18px]" />;
  }

  return (
    <button
      type="button"
      className={cn("p-0.5 flex flex-shrink-0 rounded-sm bg-surface-2 text-secondary cursor-grab", className)}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      ref={ref}
    >
      <MoreVertical className="h-3.5 w-3.5 stroke-placeholder" />
      <MoreVertical className="-ml-5 h-3.5 w-3.5 stroke-placeholder" />
    </button>
  );
});

DragHandle.displayName = "DragHandle";
