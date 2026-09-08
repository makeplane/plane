/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type React from "react";
import { useEffect } from "react";

export const useOutsideClickDetector = (
  ref: React.RefObject<HTMLElement | null> | any,
  callback: () => void,
  useCapture = false
) => {
  const handleClick = (event: MouseEvent) => {
    const path = event.composedPath();
    if (ref.current && path.includes(ref.current)) return;
    if (ref.current && !ref.current.contains(event.target as any)) {
      if (path.some((node) => node instanceof Element && node.hasAttribute("data-prevent-outside-click"))) {
        return;
      }
      callback();
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClick, useCapture);
    return () => {
      document.removeEventListener("mousedown", handleClick, useCapture);
    };
  });
};
