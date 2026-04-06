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

import type { CSSProperties, ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@plane/utils";
import { TRANSITION_MS } from "./constants";
import { useContentHeight } from "./use-content-height";

export type ContentOverflowProps = {
  children: ReactNode;
  maxHeight?: number;
  fallback?: ReactNode;
  customButton?: (props: { toggle: () => void; isExpanded: boolean }) => ReactNode;
  showMoreLabel?: string;
  showLessLabel?: string;
  forceExpanded?: boolean;
  onCollapse?: () => void;
  buttonClassName?: string;
};

export function ContentOverflow(props: ContentOverflowProps) {
  const {
    children,
    maxHeight = 625,
    fallback = null,
    customButton,
    showMoreLabel = "Show all",
    showLessLabel = "Show less",
    forceExpanded = false,
    onCollapse,
    buttonClassName,
  } = props;

  const { ref: contentRef, height: contentHeight } = useContentHeight();
  const containerRef = useRef<HTMLDivElement>(null);
  const fallbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isExpanded, setIsExpanded] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Clear transition state on transitionend
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onEnd = (e: TransitionEvent) => {
      if (e.target === el && e.propertyName === "height") {
        setIsTransitioning(false);
        if (fallbackTimer.current) {
          clearTimeout(fallbackTimer.current);
          fallbackTimer.current = null;
        }
      }
    };

    el.addEventListener("transitionend", onEnd);
    return () => el.removeEventListener("transitionend", onEnd);
  }, []);

  // Cleanup fallback timer on unmount
  useEffect(
    () => () => {
      if (fallbackTimer.current) clearTimeout(fallbackTimer.current);
    },
    []
  );

  const handleToggle = useCallback(() => {
    // Clear any in-flight fallback timer from a previous toggle
    if (fallbackTimer.current) {
      clearTimeout(fallbackTimer.current);
    }
    setIsTransitioning(true);
    setIsExpanded((prev) => {
      const next = !prev;
      if (!next) onCollapse?.();
      return next;
    });
    // Fallback: clear transitioning state if transitionend doesn't fire
    fallbackTimer.current = setTimeout(() => setIsTransitioning(false), TRANSITION_MS + 50);
  }, [onCollapse]);

  if (children == null) return fallback;

  const isMeasured = contentHeight !== null;
  const isOverflowing = isMeasured && contentHeight > maxHeight;
  const expanded = isExpanded || forceExpanded;

  // Before measurement: cap with max-height to prevent flash of full content
  // After measurement: use explicit height for smooth CSS transition
  const clipStyle: CSSProperties = isMeasured
    ? isOverflowing
      ? { height: expanded ? contentHeight : maxHeight }
      : {}
    : { maxHeight: `${maxHeight}px` };

  return (
    <div>
      <div
        ref={containerRef}
        className={cn("relative", {
          "overflow-hidden": !isMeasured || (isOverflowing && (!expanded || isTransitioning)),
          "transition-[height] duration-300 ease-in-out": isOverflowing,
        })}
        style={clipStyle}
      >
        <div ref={contentRef}>{children}</div>

        {isOverflowing && !expanded && (
          <div className="absolute bottom-0 left-0 h-24 w-full bg-gradient-to-t from-surface-1 to-transparent pointer-events-none" />
        )}
      </div>

      {isOverflowing && (
        <div style={{ pointerEvents: isTransitioning ? "none" : "auto" }}>
          {customButton ? (
            customButton({ toggle: handleToggle, isExpanded: expanded })
          ) : (
            <button
              type="button"
              className={cn("mt-1 text-accent-primary text-body-sm-regular", buttonClassName)}
              onClick={handleToggle}
              disabled={isTransitioning}
              aria-expanded={expanded}
            >
              {expanded ? showLessLabel : showMoreLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
