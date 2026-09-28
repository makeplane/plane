/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { Combobox } from "@base-ui/react/combobox";
import type { PopoverRootChangeEventDetails } from "@base-ui/react/popover";

/** Open-change details of any host a `NestedSubmenu` flyout can live under. */
type MenuDismissalEventDetails = PopoverRootChangeEventDetails | Combobox.Root.ChangeEventDetails;

/**
 * Whether a host menu's dismissal originated inside a region that owns its own dismissal
 * (`data-prevent-outside-click` — `NestedSubmenu` flyout content carries it).
 *
 * Needed only by hosts whose floating tree does NOT contain the flyout — e.g. a Combobox root
 * (flyouts are Popovers portaled to `<body>` in their own tree). Such hosts see interactions
 * inside the flyout as dismissal triggers:
 * - `outside-press`: the press landed in the flyout (event target);
 * - `focus-out`: focus moved INTO the flyout (`relatedTarget` is the element receiving it);
 * - `escape-key`: focus was inside the flyout (event target) — the flyout's own Popover closes
 *   itself; the host must stay open for the next Escape.
 *
 * Hosts that share a floating tree with their flyouts (Popover-in-Popover) get all of this from
 * base-ui natively and need none of it.
 */
export function isDismissalFromPreventedRegion(eventDetails?: MenuDismissalEventDetails): boolean {
  const origin = dismissalOriginElement(eventDetails);
  return origin !== null && origin.closest("[data-prevent-outside-click]") !== null;
}

/**
 * The other half of the cross-tree host contract, for a `Combobox.Option` that hosts a flyout:
 * base-ui items `preventDefault()` pointerdown (capture) to keep focus in the combobox input,
 * and since the flyout panel is a React CHILD of the row (portaled to `<body>`), that capture
 * handler also fires for panel-origin events — killing click focus for the panel's own search
 * input. Events whose DOM target is outside the row belong to the panel: skip the item handler
 * (base-ui's `preventBaseUIHandler` escape hatch) so their defaults survive. Row-origin events
 * keep base-ui's focus-keeping untouched.
 */
export const preservePanelPointerDefaults: NonNullable<Combobox.Item.Props["onPointerDownCapture"]> = (event) => {
  if (event.target instanceof Node && !event.currentTarget.contains(event.target)) {
    event.preventBaseUIHandler();
  }
};

/**
 * The element a dismissal ORIGINATED at, per reason: press target (`outside-press`), the element
 * receiving focus (`focus-out`), or the focused element (`escape-key`). Null for reasons with no
 * meaningful origin element (e.g. `trigger-hover` — pointer coordinates, not an element).
 */
function dismissalOriginElement(eventDetails?: MenuDismissalEventDetails): Element | null {
  const event = eventDetails?.event;
  if (!event) return null;
  const reason = eventDetails.reason;
  let origin: EventTarget | null = null;
  if (reason === "focus-out") {
    origin = event instanceof FocusEvent ? event.relatedTarget : null;
  } else if (reason === "outside-press" || reason === "escape-key") {
    origin = event.target;
  }
  return origin instanceof Element ? origin : null;
}
