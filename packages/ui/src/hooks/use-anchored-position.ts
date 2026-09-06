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
 * Replaces `usePopper` across the dropdowns. In all of them the panel's
 * `ref={setPopperElement}` callback is never invoked, so react-popper only ever
 * sees a null popper element, never builds an instance, and leaves its
 * pre-computation default of `position:absolute; left:0; top:0`.
 *
 * The three portalled dropdowns showed that as a panel in the page's top-left
 * corner. The rest hid it: their panel sits inside a `position:fixed` list that
 * normal layout happens to place near the trigger, so they looked right until
 * the trigger was near a viewport edge -- a compact icon in a work-item row --
 * and the panel then ran off the screen with nothing to clamp it, because
 * popper's `preventOverflow` was never running either.
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
  options?: { gap?: number; padding?: number; width?: number }
): CSSProperties => {
  const gap = options?.gap ?? 4;
  const padding = options?.padding ?? 12;
  // The panel's own width, so it can be kept on screen. It has to be supplied:
  // the panel is not measured here, and a compact icon trigger in a list row is
  // a fraction of the width of the calendar or member list it opens.
  const width = options?.width ?? 192;

  const [style, setStyle] = useState<CSSProperties>({
    // `fixed`, not `absolute`. Some of these panels sit inside a
    // `position:fixed` list, and an absolutely-positioned child resolves
    // against that list rather than the page, which doubles the offset and
    // throws the panel off screen. Fixed coordinates are viewport-relative and
    // so mean the same thing wherever the panel is mounted.
    position: "fixed",
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
      position: "fixed",
      left: Math.round(left),
      top: Math.round(top),
    });
  }, [referenceElement, placement, gap, padding, width]);

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
