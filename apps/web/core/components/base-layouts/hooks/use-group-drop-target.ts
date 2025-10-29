import { useEffect, useRef, useState } from "react";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";

interface UseGroupDropTargetProps {
  groupId: string;
  enableDragDrop?: boolean;
  onDrop?: (itemId: string, targetId: string | null, sourceGroupId: string, targetGroupId: string) => void;
}

interface DragSourceData {
  id: string;
  groupId: string;
  type: "ITEM" | "GROUP";
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

      canDrop: ({ source }) => {
        const data = (source?.data || {}) as Partial<DragSourceData>;
        return data.type === "ITEM" && !!data.groupId && data.groupId !== groupId;
      },

      onDragEnter: () => setIsDraggingOver(true),
      onDragLeave: () => setIsDraggingOver(false),

      onDrop: ({ source }) => {
        setIsDraggingOver(false);
        const data = (source?.data || {}) as Partial<DragSourceData>;
        if (data.type !== "ITEM" || !data.id || !data.groupId) return;
        if (data.groupId !== groupId) {
          onDrop(data.id, null, data.groupId, groupId);
        }
      },
    });

    return cleanup;
  }, [groupId, enableDragDrop, onDrop]);

  return { groupRef, isDraggingOver };
};
