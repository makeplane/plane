/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import * as React from "react";

import type { ISvgIcons } from "../type";

export function CancelledGroupIcon({
  className = "",
  color = "#9AA4BC",
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
        d="M8 15C11.87 15 15 11.87 15 8C15 4.13 11.87 1 8 1C4.13 1 1 4.13 1 8C1 11.87 4.13 15 8 15ZM11.1 4.9C11.39 5.19 11.39 5.67 11.1 5.96L9.06 8L11.1 10.04C11.39 10.33 11.39 10.81 11.1 11.1C10.81 11.39 10.33 11.39 10.04 11.1L8 9.06L5.96 11.1C5.67 11.39 5.19 11.39 4.9 11.1C4.61 10.81 4.61 10.33 4.9 10.04L6.94 8L4.9 5.96C4.61 5.67 4.61 5.19 4.9 4.9C5.19 4.61 5.67 4.61 5.96 4.9L8 6.94L10.04 4.9C10.33 4.61 10.81 4.61 11.1 4.9Z"
        fill={color}
      />
    </svg>
  );
}
