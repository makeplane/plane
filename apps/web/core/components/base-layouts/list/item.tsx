import { useEffect, useRef } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { observer } from "mobx-react";
import type { IBaseLayoutsListItem, IBaseLayoutsListItemProps } from "@plane/types";

export const BaseListItem = observer(function BaseListItem<T extends IBaseLayoutsListItem>(
  props: IBaseLayoutsListItemProps<T>
) {
  const { item, groupId, renderItem, enableDragDrop, canDrag, isLast: _isLast, index: _index } = props;
  const itemRef = useRef<HTMLDivElement | null>(null);

  const isDragAllowed = canDrag ? canDrag(item) : true;

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
        getData: () => ({ groupId, type: "ITEM" }),
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
