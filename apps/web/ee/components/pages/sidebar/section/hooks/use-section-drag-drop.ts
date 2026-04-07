/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type { RefObject } from "react";
import { useEffect, useState } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
// plane imports
import { EPageAccess } from "@plane/types";
import type { TPage, TPageDragPayload, TPageNavigationTabs } from "@plane/types";
// store
import type { TPageInstance } from "@/store/pages/base-page";
// local imports
import type { DragAndDropHookReturn } from "../types";

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
  movePageInternally: (pageId: string, updatePayload: Partial<TPage>) => Promise<void>,
  sectionType: TPageNavigationTabs,
  isSectionEmpty: boolean,
  removeFromCollectionStore?: (pageId: string) => void
): DragAndDropHookReturn => {
  // states
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

          // Determine the access level based on the section type
          let newAccess: EPageAccess | undefined;
          if (sectionType === "public") {
            newAccess = EPageAccess.PUBLIC;
          } else if (sectionType === "private") {
            newAccess = EPageAccess.PRIVATE;
          }

          const updateData: Partial<TPage> = {};

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

          void movePageInternally(droppedPageId, updateData).catch((error) => {
            console.error("Failed to update page:", error);
          });

          // Optimistically remove from collection store when making a page private
          if (newAccess === EPageAccess.PRIVATE) {
            removeFromCollectionStore?.(droppedPageId);
          }
        },
        canDrop: ({ source }) => {
          if (!isSectionEmpty) return false;
          const sourceData = source.data as TPageDragPayload;
          const { id: draggedPageId, parentId: draggedPageParentId } = sourceData;

          // Cannot drop into shared section
          if (sectionType === "shared" || sectionType === "archived") return false;

          // Get the source page to check its current state
          const sourcePage = getPageById(draggedPageId);
          if (!sourcePage) return false;

          const sameSectionAccess =
            sectionType === "public" ? EPageAccess.PUBLIC : sectionType === "private" ? EPageAccess.PRIVATE : undefined;
          const isDroppingOnTheSameSection = sameSectionAccess !== undefined && sourcePage.access === sameSectionAccess;

          if (!draggedPageParentId && isDroppingOnTheSameSection) return false;

          return true;
        },
      })
    );
  }, [
    getPageById,
    isDropping,
    isSectionEmpty,
    listSectionRef,
    movePageInternally,
    removeFromCollectionStore,
    sectionType,
  ]);

  return { isDropping };
};
