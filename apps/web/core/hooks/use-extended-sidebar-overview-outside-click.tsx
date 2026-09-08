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
      // Headless UI v2 selects on mousedown and unmounts the list in the same event.
      // After unmount, target is detached so contains()/closest() miss — use the event path.
      const path = event.composedPath();
      if (ref.current && path.includes(ref.current)) return;
      if (ref.current && !ref.current.contains(event.target)) {
        if (path.some((node) => node instanceof Element && node.hasAttribute("data-prevent-outside-click"))) {
          return;
        }
        if (path.some((node) => node instanceof Element && node.id === targetId)) {
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
