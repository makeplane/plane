import { RefObject, useEffect, useState } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { EPageAccess, WORKSPACE_PAGE_TRACKER_EVENTS } from "@plane/constants";
// types
import type { TPageDragPayload, TPageNavigationTabs } from "@plane/types";
// helpers
import { captureError, captureSuccess } from "@/helpers/event-tracker.helper";
import { TPageInstance } from "@/store/pages/base-page";
import { DragAndDropHookReturn } from "../types";

/**
 * Hook for handling section drag and drop functionality
 * @param listSectionRef Reference to the section element
 * @param getPageById Function to get page by ID
 * @param sectionType The type of section (public, private, archived, shared)
 * @returns Object containing dropping state
 */
export const useSectionDragAndDrop = (
  listSectionRef: RefObject<HTMLDivElement>,
  getPageById: (id: string) => TPageInstance | undefined,
  sectionType: TPageNavigationTabs
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
        onDrop: async ({ location, self, source }) => {
          setIsDropping(false);
          if (location.current.dropTargets[0]?.element !== self.element) return;

          const { id: droppedPageId } = source.data as TPageDragPayload;
          const droppedPageDetails = getPageById(droppedPageId);
          if (!droppedPageDetails) return;

          // Determine the access level based on the section type
          let newAccess: EPageAccess | undefined;
          if (sectionType === "public") {
            newAccess = EPageAccess.PUBLIC;
          } else if (sectionType === "private") {
            newAccess = EPageAccess.PRIVATE;
          }

          const updateData: Partial<TPageInstance> = {};

          // If the page has a parent, move it to top level
          if (droppedPageDetails.parent_id) {
            updateData.parent_id = null;
          }

          // Always update access for section drops
          if (newAccess !== undefined) {
            updateData.access = newAccess;
            // If we're setting access to public/private, unset the shared flag
            updateData.is_shared = false;
          }

          try {
            await droppedPageDetails.update(updateData);
            captureSuccess({
              eventName: WORKSPACE_PAGE_TRACKER_EVENTS.nested_page_move,
              payload: {
                id: droppedPageDetails.id,
                state: "SUCCESS",
                updated: {
                  from_access: droppedPageDetails.access,
                  to_access: newAccess,
                  from_parent: droppedPageDetails.parent_id,
                  to_parent: null,
                },
              },
            });
          } catch (error) {
            console.error("Failed to update page:", error);
            captureError({
              eventName: WORKSPACE_PAGE_TRACKER_EVENTS.nested_page_move,
              payload: {
                id: droppedPageDetails.id,
                state: "ERROR",
                updated: {
                  from_access: droppedPageDetails.access,
                  to_access: newAccess,
                  from_parent: droppedPageDetails.parent_id,
                  to_parent: null,
                },
              },
            });
          }
        },
        canDrop: ({ source }) => {
          const sourceData = source.data as TPageDragPayload;

          // Cannot drop into shared section
          if (sectionType === "shared" || sectionType === "archived") return false;

          // Get the source page to check its current state
          const sourcePage = getPageById(sourceData.id);
          if (!sourcePage) return false;

          return true;
        },
      })
    );
  }, [getPageById, isDropping, listSectionRef, sectionType]);

  return { isDropping };
};
