/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export type PortalWidth = "quarter" | "half" | "three-quarter" | "full";

export type PortalPosition = "left" | "right" | "center";

export const PORTAL_WIDTH_CLASSES = {
  quarter: "w-1/4 min-w-80 max-w-96",
  half: "w-1/2 min-w-96 max-w-2xl",
  "three-quarter": "w-3/4 min-w-96 max-w-5xl",
  full: "w-full",
} as const;

export const PORTAL_POSITION_CLASSES = {
  left: "left-0",
  right: "right-0",
  center: "left-1/2 -translate-x-1/2",
} as const;

export const DEFAULT_PORTAL_ID = "full-screen-portal";
export const MODAL_Z_INDEX = 25;
