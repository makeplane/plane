import { DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";
import { MoreVertical } from "lucide-react";

interface IDragHandle {
  isDragging: boolean;
  dragHandleProps: DraggableProvidedDragHandleProps;
}

export const DragHandle = (props: IDragHandle) => {
  const { isDragging, dragHandleProps } = props;

  return (
    <button
      type="button"
      className={`rounded text-custom-sidebar-text-200 flex flex-shrink-0 mr-1 group-hover:opacity-100 ${
        isDragging ? "opacity-100" : "opacity-0"
      }`}
      {...dragHandleProps}
    >
      <MoreVertical className="h-3.5 w-3.5 stroke-custom-text-400" />
      <MoreVertical className="h-3.5 w-3.5 stroke-custom-text-400 -ml-5" />
    </button>
  );
};
