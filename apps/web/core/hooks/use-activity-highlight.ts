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

import { useEffect, useRef } from "react";
import { ACTIVITY_HIGHLIGHT_TIMEOUT } from "@plane/constants";
import { useWorkspaceNotifications } from "@/hooks/store/notifications/use-workspace-notifications";

/**
 * Finds the nearest scrollable ancestor of an element.
 */
function getScrollParent(element: HTMLElement): HTMLElement | null {
  let parent = element.parentElement;
  while (parent) {
    const { overflowY } = getComputedStyle(parent);
    if (overflowY === "auto" || overflowY === "scroll") {
      return parent;
    }
    parent = parent.parentElement;
  }
  return null;
}

/**
 * Scrolls only the nearest scrollable ancestor to center the element in view,
 * without affecting outer scroll containers (prevents the page from scrolling
 * when the element is inside a portal/peek view).
 */
function scrollToElementInContainer(element: HTMLElement) {
  const scrollParent = getScrollParent(element);

  // Fallback to scrollIntoView when no scrollable ancestor is found
  // (e.g. element is in the document/window scroll context).
  if (!scrollParent) {
    element.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  const containerRect = scrollParent.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();

  // Always scroll to center the element — even if partially visible,
  // centering draws the user's eye to the highlighted activity.
  const offset = elementRect.top - containerRect.top - (containerRect.height - elementRect.height) / 2;
  scrollParent.scrollTo({
    top: scrollParent.scrollTop + offset,
    behavior: "smooth",
  });
}

/**
 * Hook that manages activity highlight state: scroll-into-view on notification,
 * highlight border animation, and auto-clear after timeout.
 */
export function useActivityHighlight(id: string) {
  const { higlightedActivityIds, setHighlightedActivityIds } = useWorkspaceNotifications();
  const highlightRef = useRef<HTMLDivElement>(null);
  const isHighlighted = higlightedActivityIds.includes(id);

  useEffect(() => {
    if (higlightedActivityIds.length > 0 && higlightedActivityIds[0] === id) {
      requestAnimationFrame(() => {
        if (highlightRef.current) {
          scrollToElementInContainer(highlightRef.current);
        }
      });
      const timer = setTimeout(() => {
        setHighlightedActivityIds([]);
      }, ACTIVITY_HIGHLIGHT_TIMEOUT);
      return () => clearTimeout(timer);
    }
  }, [higlightedActivityIds, id, setHighlightedActivityIds]);

  return { highlightRef, isHighlighted };
}
