/**
 * Copyright (c) 2023-present Gizmo Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import * as React from "react";

import type { ISvgIcons } from "../type";

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
      <g clipPath="url(#clip0_27_76)">
        <path
          d="M59 11.5A22 22 0 1 0 59 40.5M47 26H65V40.5"
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <text
          x="100"
          y="39"
          fontSize="34"
          fontWeight="600"
          fontFamily="'Hanken Grotesk', 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif"
          fill={color}
        >
          Gizmo
        </text>
      </g>
      <defs>
        <clipPath id="clip0_27_76">
          <rect width="252" height="53" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}
