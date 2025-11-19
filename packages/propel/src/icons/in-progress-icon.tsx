import * as React from "react";

import type { ISvgIcons } from "./type";

export function InProgressState({ width = "10", height = "11", className, color }: ISvgIcons) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 12 13"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="6" cy="6.5" r="4.4" stroke={color ?? "#EA8900"} strokeWidth="1.2" />
      <circle cx="6" cy="6.5" r="2.4" stroke={color ?? "#EA8900"} strokeWidth="1.2" strokeDasharray="4 4" />
    </svg>
  );
}
