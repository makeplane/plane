/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import * as React from "react";

import type { ISvgIcons } from "../type";

// Hangar lockup: "H" monogram + "Hangar" wordmark. Monochrome (currentColor)
// so it adapts to themes. viewBox aspect kept ~253x53 to match prior sizing.
export function PlaneLockup({ width = "253", height = "53", className, color = "currentColor" }: ISvgIcons) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 253 53"
      fill={color}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* "H" monogram */}
      <rect x="6" y="8" width="11" height="37" rx="3" fill={color} />
      <rect x="34" y="8" width="11" height="37" rx="3" fill={color} />
      <rect x="9" y="21" width="33" height="11" rx="2.5" fill={color} />
      {/* "Hangar" wordmark */}
      <text
        x="60"
        y="39"
        fontFamily="'Inter Variable', Inter, system-ui, sans-serif"
        fontSize="38"
        fontWeight="700"
        letterSpacing="-1"
        fill={color}
      >
        Hangar
      </text>
    </svg>
  );
}
