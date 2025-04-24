import { RefObject, useEffect, useState } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { TPageDragPayload } from "@plane/types";
import { TPageInstance } from "@/store/pages/base-page";
import { DragAndDropHookReturn } from "../types";

/**
 * Hook for handling section drag and drop functionality
 * @param listSectionRef Reference to the section element
 * @param getPageById Function to get page by ID
 * @returns Object containing dropping state
 */
export const useSectionDragAndDrop = (
  listSectionRef: RefObject<HTMLDivElement>,
  getPageById: (id: string) => TPageInstance | undefined
): DragAndDropHookReturn => {
  const [isDropping, setIsDropping] = useState(false);

  useEffect(() => {
    const element = listSectionRef.current;
    if (!element) return;

    return combine(
      dropTargetForElements({
        element,
        onDragEnter: () => {
          setIsDropping(true);
        },
        onDragLeave: () => {
          setIsDropping(false);
        },
        onDragStart: () => {
          setIsDropping(true);
        },
        onDrop: ({ location, self, source }) => {
          setIsDropping(false);
          if (location.current.dropTargets[0]?.element !== self.element) return;

          const { id: droppedPageId } = source.data as TPageDragPayload;
          const droppedPageDetails = getPageById(droppedPageId);
          if (!droppedPageDetails) return;
          droppedPageDetails.update({ parent_id: null });
        },
        canDrop: ({ source }) => {
          const sourceData = source.data as TPageDragPayload;
          if (!sourceData.parentId) return false;
          return true;
        },
      })
    );
  }, [getPageById, isDropping, listSectionRef]);

  return { isDropping };
};

