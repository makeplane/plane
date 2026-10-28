/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useId, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";

const TRANSITION_MS = 300;

type Props = {
  children: ReactNode;
  /** Height in px above which the content is clipped behind a "Show all" toggle. */
  maxHeight?: number;
};

/**
 * Clips long work item descriptions to `maxHeight` with a fade and a "Show all" / "Show less" toggle.
 * Purely presentational: the content is always mounted, and focusing inside it (e.g. to edit)
 * expands it so the editor is never clipped while in use.
 */
export function DescriptionOverflow(props: Props) {
  const { children, maxHeight = 140 } = props;
  // refs
  const contentRef = useRef<HTMLDivElement>(null);
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // states
  const [contentHeight, setContentHeight] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  // hooks
  const { t } = useTranslation();
  const containerId = useId();

  useEffect(() => {
    const element = contentRef.current;
    if (!element) return;
    const measure = () => setContentHeight(element.getBoundingClientRect().height);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(
    () => () => {
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    },
    []
  );

  const isMeasured = contentHeight !== null;
  const isOverflowing = isMeasured && contentHeight > maxHeight;

  const toggle = () => {
    setIsTransitioning(true);
    setIsExpanded((prev) => !prev);
    // `transitionend` does not fire when motion is reduced or the height does not change.
    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    transitionTimerRef.current = setTimeout(() => setIsTransitioning(false), TRANSITION_MS + 50);
  };

  let style: CSSProperties | undefined;
  if (!isMeasured) style = { maxHeight };
  else if (isOverflowing) style = { height: isExpanded ? contentHeight : maxHeight };

  return (
    <div>
      <div
        id={containerId}
        className={cn("relative", {
          "overflow-hidden": !isMeasured || (isOverflowing && (!isExpanded || isTransitioning)),
          "transition-[height] duration-300 ease-in-out motion-reduce:transition-none": isOverflowing,
        })}
        style={style}
        onFocus={() => {
          if (isOverflowing && !isExpanded) toggle();
        }}
        onTransitionEnd={(event) => {
          if (event.target === event.currentTarget) setIsTransitioning(false);
        }}
      >
        <div ref={contentRef}>{children}</div>
        {isOverflowing && !isExpanded && (
          <div className="pointer-events-none absolute bottom-0 left-0 h-24 w-full bg-gradient-to-t from-surface-1 to-transparent" />
        )}
      </div>
      {isOverflowing && (
        <button
          type="button"
          className="mt-1 text-left text-body-sm-regular text-accent-primary"
          onClick={toggle}
          aria-expanded={isExpanded}
          aria-controls={containerId}
        >
          {isExpanded ? t("show_less") : t("show_all")}
        </button>
      )}
    </div>
  );
}
