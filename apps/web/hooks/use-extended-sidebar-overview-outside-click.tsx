/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type React from "react";
import { useEffect, useCallback } from "react";

const useExtendedSidebarOutsideClickDetector = (
  ref: React.RefObject<HTMLElement | null>,
  callback: () => void,
  targetId: string
) => {
  const handleClick = useCallback(
    (event: MouseEvent) => {
      if (!(event.target instanceof HTMLElement)) return;
      // Frozen at dispatch — live-DOM contains()/closest() can miss a node that another
      // mousedown listener for this same click (e.g. a menu closing itself) has detached.
      const path = event.composedPath().filter((node): node is Element => node instanceof Element);
      if (ref.current && !path.includes(ref.current)) {
        // check for the closest element with attribute name data-prevent-outside-click
        const preventOutsideClickElement = path.find((el) => el.hasAttribute("data-prevent-outside-click"));
        // if the closest element with attribute name data-prevent-outside-click is found
        if (preventOutsideClickElement) {
          // Only prevent the callback if the ref is NOT inside the same prevent-outside-click container.
          // This allows normal outside click detection for elements within the same container
          if (!preventOutsideClickElement.contains(ref.current)) {
            return;
          }
        }
        // A press inside a Base UI floating layer — a menu, select, popover or dialog opened from
        // within the extended sidebar (e.g. a project's actions menu) — is outside the sidebar by
        // DOM position only: every Propel popup is portaled to <body>. Matching the portal covers
        // the whole layer (the popup and a modal popup's backdrop) without each popup opting in
        // through `data-prevent-outside-click`. Match the portal, NOT `data-base-ui-inert`: Base UI
        // puts that on the app root while a modal popup is open, and the sidebar is inside it.
        if (path.some((el) => el.hasAttribute("data-base-ui-portal") && !el.contains(ref.current))) {
          return;
        }
        // check if the click target is the excluded element or its children
        if (path.some((el) => el.id === targetId)) {
          return;
        }
        const shouldDelayOutsideClick = path.some((el) => el.hasAttribute("data-delay-outside-click"));
        if (shouldDelayOutsideClick) {
          // if the click target is inside an element with attribute name data-delay-outside-click, delay the callback
          setTimeout(() => {
            callback();
          }, 0);
          return;
        }
        // else, call the callback immediately
        callback();
      }
    },
    [ref, callback, targetId]
  );

  useEffect(() => {
    document.addEventListener("mousedown", handleClick);

    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, [handleClick]);
};

export default useExtendedSidebarOutsideClickDetector;
