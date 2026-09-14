/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { Placement } from "@floating-ui/react";
import { FloatingPortal, autoPlacement, autoUpdate, flip, offset, shift, size, useFloating } from "@floating-ui/react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";
import { cn } from "../utils";

/**
 * Placements accepted by the dropdown panel. Mirrors the Popper.js set so existing
 * call sites keep compiling; the `auto*` values let Floating UI pick the side.
 */
export type TDropdownPanelPlacement = Placement | "auto" | "auto-start" | "auto-end";

export type TDropdownPanelProps = {
  /** Whether the panel is open. The panel animates out when this flips to false. */
  open: boolean;
  /** The element the panel is anchored to (usually the trigger button). */
  reference: HTMLElement | null;
  /** Preferred placement. Defaults to `bottom-start`. */
  placement?: TDropdownPanelPlacement;
  /** Gap between the reference and the panel, in pixels. Defaults to 4. */
  sideOffset?: number;
  /** Viewport padding used when flipping and shifting, in pixels. Defaults to 12. */
  collisionPadding?: number;
  /**
   * Publish the space available below/above the anchor as the `--dropdown-available-height`
   * CSS variable on the wrapper so scrollable content can clamp itself. Defaults to true.
   */
  fitViewport?: boolean;
  /** Extra classes for the floating wrapper. */
  className?: string;
  /** Extra inline styles for the floating wrapper. */
  style?: CSSProperties;
  /** Keep the parent's outside-click detector from closing the dropdown when the panel is clicked. Defaults to true. */
  preventOutsideClick?: boolean;
  /** Where to portal the panel. Defaults to `document.body`. */
  portalRoot?: HTMLElement | null;
  children: ReactNode;
};

const AUTO_PLACEMENTS = new Set<string>(["auto", "auto-start", "auto-end"]);

const getAutoAlignment = (placement: TDropdownPanelPlacement): "start" | "end" | null | undefined => {
  if (placement === "auto-start") return "start";
  if (placement === "auto-end") return "end";
  return null;
};

const getTransformOrigin = (placement: Placement): string => {
  const [side, alignment] = placement.split("-") as [string, string | undefined];
  const vertical = side === "top" ? "bottom" : side === "bottom" ? "top" : alignment === "end" ? "bottom" : "top";
  const horizontal =
    side === "left"
      ? "right"
      : side === "right"
        ? "left"
        : alignment === "end"
          ? "right"
          : alignment === "start"
            ? "left"
            : "center";
  return `${vertical} ${horizontal}`;
};

const getSlideOffset = (placement: Placement, distance: number): { x: number; y: number } => {
  const side = placement.split("-")[0];
  if (side === "top") return { x: 0, y: distance };
  if (side === "left") return { x: distance, y: 0 };
  if (side === "right") return { x: -distance, y: 0 };
  return { x: 0, y: -distance };
};

/**
 * A portaled, viewport-aware, animated container for dropdown content.
 *
 * Positioning uses Floating UI with the `fixed` strategy so the panel escapes
 * `overflow: hidden` ancestors and transformed containers. Motion follows the
 * shadcn/Radix feel: a short fade + scale + slide from the anchored side.
 *
 * Wrap the dropdown's options (for example a static Headless UI `Combobox.Options`)
 * with this component; React context still flows through the portal.
 */
export function DropdownPanel(props: TDropdownPanelProps) {
  const {
    open,
    reference,
    placement = "bottom-start",
    sideOffset = 4,
    collisionPadding = 12,
    fitViewport = true,
    className,
    style,
    preventOutsideClick = true,
    portalRoot,
    children,
  } = props;

  const reducedMotion = useReducedMotion();
  const isAuto = AUTO_PLACEMENTS.has(placement);

  const {
    refs,
    floatingStyles,
    placement: resolvedPlacement,
  } = useFloating({
    open,
    strategy: "fixed",
    placement: isAuto ? undefined : (placement as Placement),
    // Position with top/left instead of transform so the enter/exit transform animation
    // does not fight the positioning engine.
    transform: false,
    whileElementsMounted: autoUpdate,
    elements: { reference },
    middleware: [
      offset(sideOffset),
      isAuto
        ? autoPlacement({ padding: collisionPadding, alignment: getAutoAlignment(placement) })
        : flip({ padding: collisionPadding }),
      shift({ padding: collisionPadding }),
      fitViewport
        ? size({
            padding: collisionPadding,
            apply({ availableHeight, elements }) {
              elements.floating.style.setProperty(
                "--dropdown-available-height",
                `${Math.max(160, Math.floor(availableHeight))}px`
              );
            },
          })
        : undefined,
    ],
  });

  const transformOrigin = getTransformOrigin(resolvedPlacement);
  const slide = getSlideOffset(resolvedPlacement, 6);
  const hidden = reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, x: slide.x, y: slide.y };
  const visible = reducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1, x: 0, y: 0 };

  return (
    <AnimatePresence>
      {open && (
        <FloatingPortal root={portalRoot ?? undefined}>
          <motion.div
            ref={refs.setFloating}
            className={cn("z-30 flex flex-col outline-none", className)}
            style={{ ...floatingStyles, transformOrigin, ...style }}
            data-prevent-outside-click={preventOutsideClick ? true : undefined}
            data-dropdown-panel=""
            data-side={resolvedPlacement.split("-")[0]}
            initial={hidden}
            animate={visible}
            exit={hidden}
            transition={
              reducedMotion
                ? { duration: 0.1 }
                : { type: "spring", stiffness: 700, damping: 40, mass: 0.6, opacity: { duration: 0.12 } }
            }
          >
            {children}
          </motion.div>
        </FloatingPortal>
      )}
    </AnimatePresence>
  );
}
