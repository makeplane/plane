/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

// plane imports
import { Popover as BasePopover } from "@base-ui/react/popover";
// local imports
import { MenuPanel, MenuRow } from "../menu-parts";
import { SubmenuChildLevelContext, SubmenuSideContext, useSubmenuGroup } from "./nested-submenu.context";
import type { SubmenuGroupContextValue } from "./nested-submenu.context";
import { NESTED_SUBMENU_CLOSE_DELAY_MS, NESTED_SUBMENU_OPEN_DELAY_MS } from "./nested-submenu.constants";
import { ChevronRightOutline } from "@makeplane/propel/icons";

export type NestedSubmenuProps = {
  /** Identity within the enclosing `NestedSubmenu.Group`; exclusivity is keyed on it. */
  id: string;
  trigger: ReactNode;
  children: ReactNode;
  contentClassName?: string;
};

/**
 * Menu-with-flyouts semantics over Popover primitives.
 *
 * Why not base-ui Menu: these surfaces are search-driven — a text input lives in the root and in
 * flyout bodies, and Menu's typeahead owns keystrokes, so an input cannot live inside it. Popover
 * carries the hover/dismiss mechanics; this component owns the submenu policy:
 * - exactly one open flyout per sibling level (`NestedSubmenu.Group` scopes it)
 * - hover intent on first open; instant switch between siblings once one is open
 * - trigger click opens, never toggle-closes; dismissal is hover-away, outside press, or Escape
 * - single highlight channel (hover or open) — keyboard focus renders as a ring, never the bg
 *
 * Why base-ui's popover directly rather than Propel's `PopoverContent` (finish-popover exception):
 * this is a menu flyout, not a content popover. `PopoverContent` owns its chrome, takes no
 * `className`, overwrites a caller `render`, and surfaces no popup state. A flyout needs
 * `MENU_PANEL_CLASSNAME` (`w-56`), z-70 over the parent combobox, hover-away cancel, Combobox
 * cross-tree dismissal (`nested-submenu.dismissal.ts`), and the popup's resolved `side` to cascade
 * direction. Forcing `variant="rich"` would drop those contracts. Same primitive tier as this
 * module's `Combobox` parts. A chrome-less / honoured-`render` Propel follow-up stays upstream.
 *
 * Nested flyouts are Popover-in-Popover: base-ui links them into ONE floating tree
 * (a nested `Popover.Root` joins its ancestor's `FloatingTree`), which natively handles
 * outside presses, Escapes (innermost-first), focus moves, and safe-polygon hover between a
 * trigger and its own panel — across portals. The one gap this component patches is documented
 * on the `trigger-hover` veto below.
 */
export function NestedSubmenuRoot(props: NestedSubmenuProps) {
  const { id, trigger, children, contentClassName } = props;
  const group = useSubmenuGroup();
  const inheritedSide = useContext(SubmenuSideContext);
  const open = group.activeId === id;

  // This flyout owns its CHILD level's state (the `NestedSubmenu.Group` in its panel adopts it),
  // so descendant-open is plain render state: open states cascade, so "any descendant open" is
  // exactly "my child level has an active flyout".
  const [childActiveId, setChildActiveId] = useState<string | null>(null);
  // Why the child's close reason matters: the `trigger-hover` veto below is one-shot — once this
  // panel's own hover-close was cancelled, base-ui schedules nothing further, so when the child
  // later closes by hover-away with the pointer already off this panel, this flyout would hang
  // open until the next hover/Escape/outside press. Record the reason so the effect below can
  // re-arm the close for exactly that case (an Escape must keep collapsing one level at a time).
  const childCloseReasonRef = useRef<"hover-away" | null>(null);
  const childLevel = useMemo<SubmenuGroupContextValue>(
    () => ({
      activeId: childActiveId,
      setActiveId: (nextId, reason) => {
        childCloseReasonRef.current = nextId === null ? (reason ?? null) : null;
        setChildActiveId(nextId);
      },
    }),
    [childActiveId]
  );

  // Reset the child level when this flyout closes, whatever caused it — own hover-away, sibling
  // steal, Escape, or a controlling parent. The panel (and the group that adopted the state)
  // unmounts on close, but the state lives here; in-render adjustment, no effect needed. The
  // reason goes with it: a closed flyout must never re-open into a pending deferred close.
  if (!open && childActiveId !== null) {
    childCloseReasonRef.current = null;
    setChildActiveId(null);
  }

  // Pointer presence over this flyout's own region (trigger row or panel) + the deferred close
  // the child's hover-away re-arms. Refs, not state — nothing renders off them.
  const pointerInsideRef = useRef(false);
  const deferredCloseRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelDeferredClose = () => {
    if (deferredCloseRef.current !== null) {
      clearTimeout(deferredCloseRef.current);
      deferredCloseRef.current = null;
    }
  };
  useEffect(() => {
    if (!open || childActiveId !== null || childCloseReasonRef.current !== "hover-away") return;
    childCloseReasonRef.current = null;
    if (pointerInsideRef.current) return;
    deferredCloseRef.current = setTimeout(() => {
      deferredCloseRef.current = null;
      if (!pointerInsideRef.current && group.activeId === id) group.setActiveId(null, "hover-away");
    }, NESTED_SUBMENU_CLOSE_DELAY_MS);
    return cancelDeferredClose;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reacts to the child level closing only
  }, [childActiveId, open]);

  return (
    <BasePopover.Root
      open={open}
      onOpenChange={(next, eventDetails) => {
        if (!next) {
          // Submenu semantics: clicking the trigger opens but never toggles closed.
          if (eventDetails.reason === "trigger-press") {
            eventDetails.cancel();
            return;
          }
          // The one real base-ui gap (verified in v1.2.0): the panel's own `mouseleave` handler
          // (useHoverFloatingInteraction.onFloatingMouseLeave) schedules a hover close with NO
          // descendant check — unlike safePolygon/useDismiss, which both consult the floating
          // tree. So moving the pointer from this panel into an open child's portaled panel
          // reads as hover-away. Veto it while a descendant is open.
          if (eventDetails.reason === "trigger-hover" && childActiveId !== null) {
            eventDetails.cancel();
            return;
          }
        }
        if (next) group.setActiveId(id);
        // Guard the close: a delayed close from this row must not clobber a sibling takeover.
        else if (group.activeId === id) {
          group.setActiveId(null, eventDetails.reason === "trigger-hover" ? "hover-away" : undefined);
        }
      }}
    >
      <BasePopover.Trigger
        openOnHover
        delay={NESTED_SUBMENU_OPEN_DELAY_MS}
        closeDelay={NESTED_SUBMENU_CLOSE_DELAY_MS}
        nativeButton={false}
        // Single highlight channel: pointer hover or open flyout. Keyboard focus renders as a
        // ring, never the same bg — a focus-restored trigger must not read as selected.
        render={
          <MenuRow
            highlighted={open}
            className="focus-visible:ring-1 focus-visible:ring-accent-strong focus-visible:ring-inset"
          />
        }
        onPointerEnter={(event) => {
          pointerInsideRef.current = true;
          cancelDeferredClose();
          // Touch must not steal the open flyout before its own tap resolves.
          if (event.pointerType !== "mouse" && event.pointerType !== "pen") return;
          // Menu convention: once any sibling is open, hovering another switches instantly;
          // only the first open pays the hover-intent delay.
          if (group.activeId !== null && group.activeId !== id) group.setActiveId(id);
        }}
        onPointerLeave={() => {
          pointerInsideRef.current = false;
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " " || event.key === "ArrowRight") {
            event.preventDefault();
            group.setActiveId(id);
          }
        }}
      >
        <span className="flex min-w-0 grow items-center gap-2">{trigger}</span>
        <ChevronRightOutline className="size-4 shrink-0 text-tertiary" aria-hidden />
      </BasePopover.Trigger>
      {/* Only mount the portal while open — avoids a detached-anchor flash when the parent closes. */}
      {open ? (
        <BasePopover.Portal>
          <BasePopover.Positioner
            // Inherit the cascade direction: once an ancestor flipped (viewport edge), descendants
            // keep flowing that way instead of zig-zagging back over their parents.
            side={inheritedSide ?? "right"}
            align="start"
            sideOffset={4}
            className="z-70"
          >
            <BasePopover.Popup
              // The flyout portals to <body>; ancestors in a DIFFERENT floating tree (e.g. a
              // Combobox root) see a press in here as an outside press. Mark the region so such
              // ancestors can veto their dismissal — the repo-wide data-prevent-outside-click contract.
              data-prevent-outside-click
              onPointerEnter={() => {
                pointerInsideRef.current = true;
                cancelDeferredClose();
              }}
              onPointerLeave={() => {
                pointerInsideRef.current = false;
              }}
              render={(renderProps, state) => {
                const resolvedSide = state.side === "left" || state.side === "right" ? state.side : null;
                return (
                  // Full-bleed: the levels inside bring their own padding.
                  <MenuPanel flush className={contentClassName} render={<div {...renderProps} />}>
                    <SubmenuSideContext.Provider value={resolvedSide}>
                      <SubmenuChildLevelContext.Provider value={childLevel}>
                        {children}
                      </SubmenuChildLevelContext.Provider>
                    </SubmenuSideContext.Provider>
                  </MenuPanel>
                );
              }}
            />
          </BasePopover.Positioner>
        </BasePopover.Portal>
      ) : null}
    </BasePopover.Root>
  );
}
