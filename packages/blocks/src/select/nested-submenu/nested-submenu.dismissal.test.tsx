/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { describe, expect, it, vi } from "vitest";
import { isDismissalFromPreventedRegion, preservePanelPointerDefaults } from "./nested-submenu.dismissal";

/**
 * Guards the cross-tree flyout dismissal contract now that these helpers are typed against Base UI's
 * own combobox event details rather than the workspace combobox wrapper's re-export (Task 5.2 deleted that
 * package). The two factories below build the published shapes rather than casting them away, so a
 * Base UI bump that renames a reason, narrows the event it pairs with, or moves a field fails here
 * instead of passing against a shape that no longer exists.
 */
type DismissalDetails = NonNullable<Parameters<typeof isDismissalFromPreventedRegion>[0]>;
type DismissalReason = DismissalDetails["reason"];
/** The native event Base UI pairs with a given reason. */
type EventFor<Reason extends DismissalReason> = Extract<DismissalDetails, { reason: Reason }>["event"];

/**
 * Every field Base UI publishes on a change-event details object. Only `event: null` needs the
 * assertion — Base UI types it non-nullable, and a reason with no origin event is exactly the case
 * these helpers have to tolerate.
 */
function detailsFor<Reason extends DismissalReason>(reason: Reason, event: EventFor<Reason> | null): DismissalDetails {
  return {
    reason,
    event,
    cancel: () => {},
    allowPropagation: () => {},
    preventUnmountOnClose: () => {},
    isCanceled: false,
    isPropagationAllowed: false,
    trigger: undefined,
  } as Extract<DismissalDetails, { reason: Reason }>;
}

type PointerDownCaptureEvent = Parameters<typeof preservePanelPointerDefaults>[0];

/**
 * The three fields the helper reads, checked against Base UI's own item event — the rest of a React
 * synthetic event is not constructible in a unit test.
 */
function pointerDownCapture(
  fields: Pick<PointerDownCaptureEvent, "target" | "currentTarget" | "preventBaseUIHandler">
): PointerDownCaptureEvent {
  return fields as PointerDownCaptureEvent;
}

function buildTree() {
  document.body.replaceChildren();
  const host = document.createElement("div");
  const panel = document.createElement("div");
  panel.setAttribute("data-prevent-outside-click", "");
  const inside = document.createElement("button");
  panel.appendChild(inside);
  const outside = document.createElement("button");
  document.body.append(host, panel, outside);
  return { inside, outside };
}

describe("isDismissalFromPreventedRegion", () => {
  it("keeps the host open for an outside press that landed in a flyout panel", () => {
    const { inside, outside } = buildTree();
    const pressInside = new MouseEvent("mousedown");
    Object.defineProperty(pressInside, "target", { value: inside });
    expect(isDismissalFromPreventedRegion(detailsFor("outside-press", pressInside))).toBe(true);

    const pressOutside = new MouseEvent("mousedown");
    Object.defineProperty(pressOutside, "target", { value: outside });
    expect(isDismissalFromPreventedRegion(detailsFor("outside-press", pressOutside))).toBe(false);
  });

  it("reads focus-out off the element receiving focus, not the one losing it", () => {
    const { inside, outside } = buildTree();
    const intoPanel = new FocusEvent("focusout");
    Object.defineProperty(intoPanel, "relatedTarget", { value: inside });
    expect(isDismissalFromPreventedRegion(detailsFor("focus-out", intoPanel))).toBe(true);

    const away = new FocusEvent("focusout");
    Object.defineProperty(away, "relatedTarget", { value: outside });
    expect(isDismissalFromPreventedRegion(detailsFor("focus-out", away))).toBe(false);
  });

  it("keeps the host open for an Escape pressed inside a flyout — the flyout closes itself", () => {
    const { inside } = buildTree();
    const escape = new KeyboardEvent("keydown", { key: "Escape" });
    Object.defineProperty(escape, "target", { value: inside });
    expect(isDismissalFromPreventedRegion(detailsFor("escape-key", escape))).toBe(true);
  });

  it("has no opinion on reasons with no origin element", () => {
    buildTree();
    expect(isDismissalFromPreventedRegion(detailsFor("trigger-hover", new MouseEvent("mousemove")))).toBe(false);
    expect(isDismissalFromPreventedRegion(detailsFor("outside-press", null))).toBe(false);
    expect(isDismissalFromPreventedRegion(undefined)).toBe(false);
  });
});

describe("preservePanelPointerDefaults", () => {
  it("skips base-ui's item handler for events that came from the portaled panel", () => {
    const { inside } = buildTree();
    const row = document.createElement("div");
    document.body.appendChild(row);
    const preventBaseUIHandler = vi.fn();
    preservePanelPointerDefaults(pointerDownCapture({ target: inside, currentTarget: row, preventBaseUIHandler }));
    expect(preventBaseUIHandler).toHaveBeenCalledTimes(1);
  });

  it("leaves base-ui's focus-keeping alone for events that came from the row itself", () => {
    buildTree();
    const row = document.createElement("div");
    const child = document.createElement("span");
    row.appendChild(child);
    document.body.appendChild(row);
    const preventBaseUIHandler = vi.fn();
    preservePanelPointerDefaults(pointerDownCapture({ target: child, currentTarget: row, preventBaseUIHandler }));
    expect(preventBaseUIHandler).not.toHaveBeenCalled();
  });
});
