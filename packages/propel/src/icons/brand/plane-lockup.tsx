/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import * as React from "react";

import type { ISvgIcons } from "../type";

export function PlaneLockup({ width = "160", height = "32", className }: ISvgIcons) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 160 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="shieldGradLockup" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3f76ff" />
          <stop offset="100%" stopColor="#00f0ff" />
        </linearGradient>
        <linearGradient id="wGradLockup" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#00f0ff" />
          <stop offset="100%" stopColor="#3f76ff" />
        </linearGradient>
      </defs>
      <g transform="translate(0, 4)">
        <path
          d="M12 2L4 5v6c0 5.25 3.41 10.17 8 11 4.59-.83 8-5.75 8-11V5l-8-3zm0 2.18c3.42.71 6 3.82 6 7.42 0 4.15-2.73 8.07-6 8.92-3.27-.85-6-4.77-6-8.92 0-3.6 2.58-6.71 6-7.42z"
          fill="url(#shieldGradLockup)"
        />
        <path
          d="M8.5 8.5L10.5 13.5L12 11.5L13.5 13.5L15.5 8.5H14.25L13.25 11.25L12 9.5L10.75 11.25L9.75 8.5H8.5Z"
          fill="url(#wGradLockup)"
        />
      </g>
      <text
        x="28"
        y="21"
        fontFamily="Outfit, system-ui, -apple-system, sans-serif"
        fontSize="19"
        fontWeight="900"
        letterSpacing="-0.05em"
        fill="#1b6ec2"
      >
        WinSecOps
      </text>
    </svg>
  );
}
