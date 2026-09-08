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
      if (!(event.target instanceof Node)) return;
      // Headless UI v2 selects on mousedown and unmounts the list in the same event.
      // After unmount, target is detached so contains()/closest() miss — use the event path.
      const path = event.composedPath();
      if (ref.current && path.includes(ref.current)) return;
      if (ref.current && !ref.current.contains(event.target)) {
        const preventOutsideClickElement = path.find(
          (node): node is Element => node instanceof Element && node.hasAttribute("data-prevent-outside-click")
        );
        if (preventOutsideClickElement) {
          const elementId = preventOutsideClickElement.id;
          const shouldExcludePrevention =
            excludePreventionElementIds && elementId && excludePreventionElementIds.includes(elementId);

          if (!shouldExcludePrevention && !preventOutsideClickElement.contains(ref.current)) {
            // Only prevent the callback if the ref is NOT inside the same prevent-outside-click container.
            // This allows normal outside click detection for elements within the same container
            return;
          }
        }
        if (path.some((node) => node instanceof Element && node.id === `issue-${issueId}`)) {
          return;
        }
        if (path.some((node) => node instanceof Element && node.hasAttribute("data-delay-outside-click"))) {
          setTimeout(() => {
            callback();
          }, 0);
          return;
        }
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
