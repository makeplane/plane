import { useEffect, useRef, useState } from "react";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";

interface UseGroupDropTargetProps {
  groupId: string;
  enableDragDrop?: boolean;
  onDrop?: (
    itemId: string,
    targetId: string | null,
    sourceGroupId: string,
    targetGroupId: string
  ) => void | Promise<void>;
}

interface DragSourceData {
  id: string;
  groupId: string;
}

/**
 * A hook that turns an element into a valid drop target for group drag-and-drop.
 *
 * @returns groupRef (attach to the droppable container) and isDraggingOver (for visual feedback)
 */
export const useGroupDropTarget = ({ groupId, enableDragDrop = false, onDrop }: UseGroupDropTargetProps) => {
  const groupRef = useRef<HTMLDivElement | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  useEffect(() => {
    const element = groupRef.current;
    if (!element || !enableDragDrop || !onDrop) return;

    const cleanup = dropTargetForElements({
      element,
      getData: () => ({ groupId, type: "GROUP" }),

      // Optional drop validation
      canDrop: ({ source }) => {
        const sourceData = source.data as Partial<DragSourceData>;
        return sourceData.groupId !== groupId;
      },

      onDragEnter: () => setIsDraggingOver(true),
      onDragLeave: () => setIsDraggingOver(false),

      onDrop: ({ source }) => {
        setIsDraggingOver(false);
        const sourceData = source.data as unknown as DragSourceData;

        // Only trigger onDrop if dropped in a different group
        if (sourceData.groupId !== groupId) {
          onDrop(sourceData.id, null, sourceData.groupId, groupId);
        }
      },
    });

    return cleanup;
  }, [groupId, enableDragDrop, onDrop]);

  return { groupRef, isDraggingOver };
};
