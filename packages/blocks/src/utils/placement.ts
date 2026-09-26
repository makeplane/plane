/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// types
export type Placement =
  | "auto"
  | "auto-start"
  | "auto-end"
  | "top-start"
  | "top-end"
  | "bottom-start"
  | "bottom-end"
  | "right-start"
  | "right-end"
  | "left-start"
  | "left-end"
  | "top"
  | "bottom"
  | "right"
  | "left";

/** @deprecated Use Placement instead. */
export type TPlacement = Placement;

export type Side = "top" | "bottom" | "left" | "right";

/** @deprecated Use Side instead. */
export type TSide = Side;

export type Align = "start" | "center" | "end";

/** @deprecated Use Align instead. */
export type TAlign = Align;

// placement conversion map
const PLACEMENT_MAP = new Map<Placement, { side: Side; align: Align }>([
  ["auto", { side: "bottom", align: "center" }],
  ["auto-start", { side: "bottom", align: "start" }],
  ["auto-end", { side: "bottom", align: "end" }],
  ["top", { side: "top", align: "center" }],
  ["bottom", { side: "bottom", align: "center" }],
  ["left", { side: "left", align: "center" }],
  ["right", { side: "right", align: "center" }],
  ["top-start", { side: "top", align: "start" }],
  ["top-end", { side: "top", align: "end" }],
  ["bottom-start", { side: "bottom", align: "start" }],
  ["bottom-end", { side: "bottom", align: "end" }],
  ["left-start", { side: "left", align: "start" }],
  ["left-end", { side: "left", align: "end" }],
  ["right-start", { side: "right", align: "start" }],
  ["right-end", { side: "right", align: "end" }],
]);

// conversion function
export function convertPlacementToSideAndAlign(placement: Placement): {
  side: Side;
  align: Align;
} {
  return PLACEMENT_MAP.get(placement) || { side: "bottom", align: "center" };
}
