/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import * as React from "react";

import type { ISvgIcons } from "../type";

// Hangar "H" monogram. Monochrome (inherits currentColor) so it adapts to themes.
export function PlaneLogo({ width = "48", height = "48", className, color = "currentColor" }: ISvgIcons) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 48 48"
      fill={color}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect x="9" y="7" width="8.5" height="34" rx="2.5" fill={color} />
      <rect x="30.5" y="7" width="8.5" height="34" rx="2.5" fill={color} />
      <rect x="12" y="19.75" width="24" height="8.5" rx="2" fill={color} />
    </svg>
  );
}
