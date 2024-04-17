import { forwardRef } from "react";
import { MoreVertical } from "lucide-react";

interface IDragHandle {
  isDragging: boolean;
}

export const DragHandle = forwardRef<HTMLButtonElement | null, IDragHandle>((props, ref) => {
  const { isDragging } = props;

  return (
    <button
      type="button"
      className={`mr-1 flex flex-shrink-0 rounded text-custom-sidebar-text-200 group-hover:opacity-100 cursor-grab ${
        isDragging ? "opacity-100" : "opacity-0"
      }`}
      ref={ref}
    >
      <MoreVertical className="h-3.5 w-3.5 stroke-custom-text-400" />
      <MoreVertical className="-ml-5 h-3.5 w-3.5 stroke-custom-text-400" />
    </button>
  );
});

DragHandle.displayName = "DragHandle";
