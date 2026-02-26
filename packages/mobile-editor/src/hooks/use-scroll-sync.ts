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

import { useEffect, useState } from "react";
import type { RefObject } from "react";
// types
import type { EditorRefApi } from "@plane/editor";

interface UseScrollSyncOptions {
  /**
   * The ID of the container element to sync with window scroll
   */
  containerId: string;
  /**
   * Delay before initializing the scroll sync (in milliseconds)
   * @default 100
   */
  initializationDelay?: number;
  /**
   * Whether to enable the scroll synchronization
   * @default true
   */
  enabled?: boolean;
  editorRef?: RefObject<EditorRefApi | null>;
}

/**
 * Custom hook that synchronizes container scroll with window scroll for smooth mobile experience
 *
 * @param options Configuration options for scroll synchronization
 *
 * @example
 * ```tsx
 * // Basic usage
 * useScrollSync({ containerId: "mobile-editor-container" });
 *
 * // With custom options
 * useScrollSync({
 *   containerId: "my-container",
 *   initializationDelay: 200,
 *   enabled: isScrollSyncEnabled
 * });
 * ```
 */
export const useScrollSync = ({
  containerId,
  initializationDelay = 100,
  enabled = true,
  editorRef,
}: UseScrollSyncOptions) => {
  const [canScroll, setCanScroll] = useState(true);
  useEffect(() => {
    if (!enabled) return;

    let isScrolling = false;
    let previousContainerScrollTop = 0;
    let animationFrameId: number | null = null;
    let container: HTMLElement | null = null;
    let throttleTimeout: number | null = null;

    const updateWindowScroll = (scrollDelta: number) => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }

      animationFrameId = requestAnimationFrame(() => {
        const currentWindowScrollTop = window.pageYOffset;
        const newWindowScrollTop = Math.max(0, currentWindowScrollTop + scrollDelta);

        // Use native scrollTo for better performance
        if (container?.scrollTop && container.scrollTop <= 0 && newWindowScrollTop > 50) {
          editorRef?.current?.blur();
        } else {
          if (canScroll) {
            window.scrollTo(0, newWindowScrollTop);
          }
        }

        // Reset scrolling flag after a short delay
        setTimeout(() => {
          isScrolling = false;
        }, 16); // ~60fps

        animationFrameId = null;
      });
    };

    const handleContainerScroll = () => {
      if (!container) return;

      const currentContainerScrollTop = container.scrollTop;
      const scrollDelta = currentContainerScrollTop - previousContainerScrollTop;

      previousContainerScrollTop = currentContainerScrollTop;
      if (scrollDelta !== 0 && !isScrolling) {
        isScrolling = true;
        updateWindowScroll(scrollDelta);
      }
    };

    // Throttled version of scroll handler for better performance
    const throttledScrollHandler = () => {
      if (throttleTimeout) return;

      throttleTimeout = requestAnimationFrame(() => {
        handleContainerScroll();
        throttleTimeout = null;
      }) as unknown as number;
    };

    const handleTouchStart = () => {
      if (canScroll) return;
      setCanScroll(true);
    };
    const handleTouchEnd = () => {
      if (!canScroll) return;
      setCanScroll(false);
    };

    // Initialize container
    const initializeContainer = () => {
      container = document.getElementById(containerId);
      if (container) {
        previousContainerScrollTop = container.scrollTop;
        container.addEventListener("scroll", throttledScrollHandler, { passive: true });
        container.addEventListener("touchstart", handleTouchStart);
        container.addEventListener("touchend", handleTouchEnd);
      }
    };

    // Use configurable timeout for initialization
    const timeoutId = setTimeout(initializeContainer, initializationDelay);

    return () => {
      clearTimeout(timeoutId);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (throttleTimeout) {
        cancelAnimationFrame(throttleTimeout);
      }
      container?.removeEventListener("scroll", throttledScrollHandler);
      container?.removeEventListener("touchstart", handleTouchStart);
      container?.removeEventListener("touchend", handleTouchEnd);
    };
  }, [containerId, initializationDelay, enabled, editorRef, canScroll]);
};
