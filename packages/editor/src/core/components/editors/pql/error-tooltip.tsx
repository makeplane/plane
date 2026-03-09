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

import { useEffect, useRef, useState } from "react";

interface TooltipState {
  message: string;
  x: number;
  y: number;
}

interface PQLErrorTooltipProps {
  /** The container element whose decorated children we listen to */
  containerRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Listens for mouse-enter events on elements with the `pql-error-underline`
 * class inside the provided container and renders a floating error tooltip.
 */
export function PQLErrorTooltip({ containerRef }: PQLErrorTooltipProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function onMouseOver(e: MouseEvent) {
      const target = e.target as HTMLElement;
      const span = target.closest<HTMLElement>(".pql-error-underline");
      if (!span) return;

      const message = span.dataset.pqlError;
      if (!message) return;

      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }

      const rect = span.getBoundingClientRect();
      setTooltip({ message, x: rect.left + rect.width / 2, y: rect.top - 8 });
    }

    function onMouseOut(e: MouseEvent) {
      const related = e.relatedTarget as HTMLElement | null;
      const tooltipEl = document.getElementById("pql-error-tooltip");
      if (related && tooltipEl?.contains(related)) return;
      hideTimerRef.current = setTimeout(() => setTooltip(null), 150);
    }

    container.addEventListener("mouseover", onMouseOver);
    container.addEventListener("mouseout", onMouseOut);
    return () => {
      container.removeEventListener("mouseover", onMouseOver);
      container.removeEventListener("mouseout", onMouseOut);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [containerRef]);

  if (!tooltip) return null;

  return (
    <div
      id="pql-error-tooltip"
      role="tooltip"
      className="fixed z-50 max-w-xs -translate-x-1/2 -translate-y-full rounded-md border border-danger-subtle bg-danger-subtle px-3 py-1.5 text-12 text-danger-secondary shadow-raised-200"
      style={{ left: tooltip.x, top: tooltip.y }}
      onMouseEnter={() => {
        if (hideTimerRef.current) {
          clearTimeout(hideTimerRef.current);
          hideTimerRef.current = null;
        }
      }}
      onMouseLeave={() => {
        hideTimerRef.current = setTimeout(() => setTooltip(null), 150);
      }}
    >
      {tooltip.message}
      <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-danger-subtle" />
    </div>
  );
}
