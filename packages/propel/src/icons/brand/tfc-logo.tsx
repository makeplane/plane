/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import * as React from "react";

import type { ISvgIcons } from "../type";

export function TFCLogo({
  width = "85",
  height = "52",
  className,
  color = "currentColor",
}: ISvgIcons) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 85 52"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* T */}
      <path
        d="M2 5C2 3.343 3.343 2 5 2H25C26.657 2 28 3.343 28 5V9C28 10.657 26.657 12 25 12H20V47C20 48.657 18.657 50 17 50H13C11.343 50 10 48.657 10 47V12H5C3.343 12 2 10.657 2 9V5Z"
        fill={color}
      />

      {/* F */}
      <path
        d="M34 2H57C58.657 2 60 3.343 60 5V9C60 10.657 58.657 12 57 12H44V20H55C56.657 20 58 21.343 58 23V27C58 28.657 56.657 30 55 30H44V47C44 48.657 42.657 50 41 50H37C35.343 50 34 48.657 34 47V5C34 3.343 35.343 2 37 2H34Z"
        fill={color}
      />

      {/* C */}
      <path
        d="M80 13.5C80 15.433 78.433 17 76.5 17H72C70.343 17 69 15.657 69 14V13C69 12.448 68.552 12 68 12H67C65.343 12 64 13.343 64 15V37C64 38.657 65.343 40 67 40H68C68.552 40 69 39.552 69 39V38C69 36.343 70.343 35 72 35H76.5C78.433 35 80 36.567 80 38.5V43C80 46.866 76.866 50 73 50H66C59.373 50 54 44.627 54 38V14C54 7.373 59.373 2 66 2H73C76.866 2 80 5.134 80 9V13.5Z"
        fill={color}
      />
    </svg>
  );
}