/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * Every placement popper accepts, kept as a literal union so Popper does not have to be a
 * dependency of this package. Structurally identical to popper's own `Placement`, so a call site
 * that stores one in a `Placement`-typed variable still assigns.
 */
export type TPopoverMenuPlacement =
  | "auto"
  | "auto-start"
  | "auto-end"
  | "top"
  | "top-start"
  | "top-end"
  | "bottom"
  | "bottom-start"
  | "bottom-end"
  | "left"
  | "left-start"
  | "left-end"
  | "right"
  | "right-start"
  | "right-end";

type TPopoverSide = "top" | "bottom" | "left" | "right";
type TPopoverAlign = "start" | "center" | "end";

/**
 * Splits a popper placement into the `side` + `align` pair Propel's positioner takes.
 *
 * Popper's `auto*` family picks the side with the most room at layout time and has no Base UI
 * equivalent — Base UI resolves the same problem with `collisionAvoidance`, which flips the side on
 * its own. So `auto*` resolves to `side: "bottom"` (the placement popper lands on in the common
 * case, and the one every `auto*` call site in the app is already rendering) and keeps its own
 * alignment: `auto-end` → `end`, and both `auto` and `auto-start` → `start`.
 */
export function toSideAndAlign(placement: TPopoverMenuPlacement): { side: TPopoverSide; align: TPopoverAlign } {
  const [base, variation] = placement.split("-") as [TPopoverSide | "auto", "start" | "end" | undefined];
  if (base === "auto") return { side: "bottom", align: variation === "end" ? "end" : "start" };
  return { side: base, align: variation ?? "center" };
}
