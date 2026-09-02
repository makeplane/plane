/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import * as React from "react";

import type { ISvgIcons } from "../type";

export function CompletedGroupIcon({
  className = "",
  color = "#46A758",
  height = "20",
  width = "20",
  ...rest
}: ISvgIcons) {
  return (
    <svg
      height={height}
      width={width}
      className={className}
      viewBox="0 0 16 16"
      xmlns="http://www.w3.org/2000/svg"
      {...rest}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8 15C11.87 15 15 11.87 15 8C15 4.13 11.87 1 8 1C4.13 1 1 4.13 1 8C1 11.87 4.13 15 8 15ZM11.36 6.19C11.6 5.85 11.52 5.38 11.19 5.14C10.85 4.9 10.38 4.98 10.14 5.31L7.04 9.62L5.26 7.98C4.96 7.7 4.48 7.71 4.2 8.02C3.92 8.32 3.94 8.8 4.24 9.08L6.64 11.3C6.8 11.45 7.01 11.52 7.22 11.5C7.44 11.47 7.63 11.36 7.76 11.19L11.36 6.19Z"
        fill={color}
      />
    </svg>
  );
}
