/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import type { CSSProperties } from "react";
import type { Placement } from "@popperjs/core";

/**
 * Position a portalled dropdown panel against its trigger.
 *
 * Replaces `usePopper` for the three dropdowns whose panel is rendered through
 * `createPortal` into `document.body`. In those, the panel's
 * `ref={setPopperElement}` callback is never invoked, so react-popper only ever
 * sees a null popper element, never builds an instance, and leaves its
 * pre-computation default of `position:absolute; left:0; top:0` -- which is the
 * panel sitting in the top-left corner of the page.
 *
 * This needs no ref on the panel at all: everything is derived from the trigger,
 * which is reliably available. The trade-off against a full positioning engine
 * is that the panel is measured once per open rather than continuously, so it
 * flips and clamps against the viewport but does not re-solve while an
 * ancestor scrolls. For a dropdown that closes on outside interaction that is
 * the same thing in practice, and it is recomputed on scroll and resize anyway.
 */
export const useAnchoredPosition = (
  referenceElement: HTMLElement | null,
  placement: Placement = "bottom-start",
  options?: { gap?: number; padding?: number }
): CSSProperties => {
  const gap = options?.gap ?? 4;
  const padding = options?.padding ?? 12;

  const [style, setStyle] = useState<CSSProperties>({
    position: "absolute",
    // Off-screen rather than at 0,0 until the first measurement lands, so a
    // panel is never briefly painted in the corner.
    left: -9999,
    top: -9999,
  });

  const compute = useCallback(() => {
    if (!referenceElement) return;

    const anchor = referenceElement.getBoundingClientRect();
    const [side, align = "start"] = placement.split("-");
    const viewportW = document.documentElement.clientWidth;
    const viewportH = document.documentElement.clientHeight;

    // The panel is not measured, so assume nothing about its size beyond a
    // sensible cap; clamping below keeps it on screen either way.
    const width = Math.min(anchor.width, 320);

    let left: number;
    if (side === "left") left = anchor.left - gap - width;
    else if (side === "right") left = anchor.right + gap;
    else if (align === "end") left = anchor.right - width;
    else left = anchor.left;

    let top: number;
    if (side === "top") top = anchor.top - gap;
    else if (side === "left" || side === "right") top = align === "end" ? anchor.bottom : anchor.top;
    else top = anchor.bottom + gap;

    // Flip a bottom-placed panel above the trigger when there is clearly no
    // room below, then clamp both axes into the viewport.
    const spaceBelow = viewportH - anchor.bottom;
    if (side === "bottom" && spaceBelow < 200 && anchor.top > spaceBelow) {
      top = Math.max(padding, anchor.top - gap - Math.min(anchor.top - padding, 320));
    }

    left = Math.min(Math.max(padding, left), Math.max(padding, viewportW - width - padding));
    top = Math.min(Math.max(padding, top), Math.max(padding, viewportH - padding - 40));

    setStyle({
      position: "absolute",
      left: Math.round(left + window.scrollX),
      top: Math.round(top + window.scrollY),
    });
  }, [referenceElement, placement, gap, padding]);

  useLayoutEffect(() => {
    compute();
  }, [compute]);

  useEffect(() => {
    if (!referenceElement) return;
    // `capture` so an ancestor scrolling moves the panel too, not just the window.
    window.addEventListener("scroll", compute, true);
    window.addEventListener("resize", compute);
    return () => {
      window.removeEventListener("scroll", compute, true);
      window.removeEventListener("resize", compute);
    };
  }, [referenceElement, compute]);

  return style;
};
