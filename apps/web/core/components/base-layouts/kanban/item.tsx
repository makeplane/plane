import { useEffect, useRef } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { observer } from "mobx-react";
import type { IBaseLayoutsKanbanItem, IBaseLayoutsKanbanItemProps } from "@plane/types";

export const BaseKanbanItem = observer(function BaseKanbanItem<T extends IBaseLayoutsKanbanItem>(
  props: IBaseLayoutsKanbanItemProps<T>
) {
  const { item, groupId, renderItem, enableDragDrop, canDrag } = props;

  const itemRef = useRef<HTMLDivElement | null>(null);

  const isDragAllowed = canDrag ? canDrag(item) : true;

  // Setup draggable and drop target
  useEffect(() => {
    const element = itemRef.current;
    if (!element || !enableDragDrop) return;

    return combine(
      draggable({
        element,
        canDrag: () => isDragAllowed,
        getInitialData: () => ({ id: item.id, type: "ITEM", groupId }),
      }),
      dropTargetForElements({
        element,
        getData: () => ({ id: item.id, groupId, type: "ITEM" }),
        canDrop: ({ source }) => source?.data?.id !== item.id,
      })
    );
  }, [enableDragDrop, isDragAllowed, item.id, groupId]);

  const renderedItem = renderItem(item, groupId);

  return (
    <div ref={itemRef} className="cursor-pointer">
      {renderedItem}
    </div>
  );
});
