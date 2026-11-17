/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type React from "react";
import { useEffect, useCallback } from "react";

const usePeekOverviewOutsideClickDetector = (
  ref: React.RefObject<HTMLElement | null>,
  callback: () => void,
  issueId: string,
  excludePreventionElementIds?: string[]
) => {
  const handleClick = useCallback(
    (event: MouseEvent) => {
      // Frozen at dispatch — live-DOM contains()/closest() can miss a node that another
      // mousedown listener for this same click (e.g. a dropdown closing itself) has detached.
      const path = event.composedPath().filter((node): node is Element => node instanceof Element);
      if (ref.current && !path.includes(ref.current)) {
        // check for the closest element with attribute name data-prevent-outside-click
        const preventOutsideClickElement = path.find((el) => el.hasAttribute("data-prevent-outside-click"));
        // if the closest element with attribute name data-prevent-outside-click is found
        if (preventOutsideClickElement) {
          // Check if this element's ID is in the exclusion list
          const elementId = preventOutsideClickElement.id;
          const shouldExcludePrevention =
            excludePreventionElementIds && elementId && excludePreventionElementIds.includes(elementId);

          if (!shouldExcludePrevention && !preventOutsideClickElement.contains(ref.current)) {
            // Only prevent the callback if the ref is NOT inside the same prevent-outside-click container.
            // This allows normal outside click detection for elements within the same container
            return;
          }
        }
        // A press inside a Base UI floating layer — a menu, select or popover opened from within
        // the peek — is outside the peek by DOM position only: every popup is portaled to <body>.
        // Marking the portal covers the whole layer (the popup and a modal menu's backdrop both
        // live inside it) without each popup having to opt in through `data-prevent-outside-click`
        // the way blocks' own panels do. Propel's Menu does not, which is what closed the peek as
        // soon as a menu item was pressed.
        //
        // The portal is the marker to match on, NOT `data-base-ui-inert`: Base UI puts that on the
        // app root while a modal popup is open, and the peek is inside it — matching on it would
        // stop every press on the page from dismissing the peek.
        if (path.some((el) => el.hasAttribute("data-base-ui-portal"))) {
          return;
        }
        // check if the click target is the current issue element or its children
        if (path.some((el) => el.id === `issue-${issueId}`)) {
          return;
        }
        const shouldDelayOutsideClick = path.some((el) => el.hasAttribute("data-delay-outside-click"));
        if (shouldDelayOutsideClick) {
          setTimeout(() => {
            callback();
          }, 0);
          return;
        }
        // else, call the callback immediately
        callback();
      }
    },
    [ref, callback, issueId, excludePreventionElementIds]
  );

  useEffect(() => {
    document.addEventListener("mousedown", handleClick);

    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, [handleClick]);
};

export default usePeekOverviewOutsideClickDetector;
