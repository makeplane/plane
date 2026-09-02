/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import * as React from "react";

import type { ISvgIcons } from "../type";

export function PlaneLogo({ width = "85", height = "52", className, color = "currentColor" }: ISvgIcons) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 85 52"
      fill={color}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M44.32 2.93C44.32 0.75 46.61 -0.66 48.55 0.31L80.46 16.27C82.93 17.5 84.49 20.03 84.49 22.8V48.25C84.49 50.42 82.21 51.83 80.26 50.86L62.33 41.89V22.8C62.33 20.03 60.77 17.5 58.29 16.26L44.32 9.28V2.93ZM0 2.93C8.02e-05 0.75 2.29 -0.66 4.23 0.31L22.16 9.28V28.38C22.16 31.14 23.72 33.67 26.2 34.91L40.17 41.9V48.25C40.17 50.42 37.88 51.83 35.94 50.86L4.04 34.91C1.56 33.67 0 31.14 0 28.38V2.93ZM22.16 2.93C22.16 0.75 24.44 -0.66 26.39 0.31L44.32 9.28V28.38C44.32 31.14 45.89 33.67 48.36 34.91L62.33 41.89V48.25C62.33 50.42 60.04 51.83 58.1 50.86L40.17 41.9V22.8C40.17 20.03 38.61 17.5 36.13 16.26L22.16 9.28V2.93Z"
        fill={color}
      />
    </svg>
  );
}
