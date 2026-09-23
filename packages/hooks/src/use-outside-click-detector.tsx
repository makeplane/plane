/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useLayoutEffect, useRef } from "react";

export const useOutsideClickDetector = (
  ref: { readonly current: Element | null },
  callback: () => void,
  useCapture = false,
  enabled = true
) => {
  // Keep the latest callback/useCapture in refs so the document listener binds once per
  // consumer instead of re-attaching on every render.
  const callbackRef = useRef(callback);
  const useCaptureRef = useRef(useCapture);

  useLayoutEffect(() => {
    callbackRef.current = callback;
    useCaptureRef.current = useCapture;
  });

  useEffect(() => {
    if (!enabled) return;

    const handleClick = (event: MouseEvent) => {
      // Frozen at dispatch — live-DOM contains()/closest() can miss a node that another
      // mousedown listener for this same click (e.g. a menu closing itself) has detached.
      const path = event.composedPath().filter((node): node is Element => node instanceof Element);
      const node = ref.current;
      if (node && !path.includes(node)) {
        const preventOutsideClickElement = path.find((el) => el.hasAttribute("data-prevent-outside-click"));
        if (preventOutsideClickElement) {
          // Only prevent the callback if the ref is NOT inside the same prevent-outside-click container.
          // This allows normal outside click detection for elements within the same container
          // (e.g., dropdowns inside a floating panel should still close on outside click within that panel)
          if (!preventOutsideClickElement.contains(node)) {
            return;
          }
        }
        // Propel popups (Select, Menu, nested Dialog) render in a Base UI portal on
        // <body>, so the press path is outside `node` even when the popup was opened
        // from this consumer. Skip those. Do not skip the consumer's own dialog portal
        // (`portal.contains(node)`): clicking another field inside the same dialog must
        // still close a local dropdown.
        if (path.some((el) => el.hasAttribute("data-base-ui-portal") && !el.contains(node))) {
          return;
        }
        callbackRef.current();
      }
    };

    const capture = useCaptureRef.current;
    document.addEventListener("mousedown", handleClick, capture);
    return () => {
      document.removeEventListener("mousedown", handleClick, capture);
    };
  }, [ref, enabled, useCapture]);
};
