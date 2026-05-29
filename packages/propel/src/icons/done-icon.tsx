import * as React from "react";

import type { ISvgIcons } from "./type";

export function DoneState({ width = "10", height = "11", className }: ISvgIcons) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 10 11"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="5" cy="5.5" r="4.4" stroke="#15A34A" strokeWidth="1.2" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M2.5 5.59375L3.82582 6.91957L4.26777 6.47763L2.94194 5.15181L2.5 5.59375ZM4.26777 7.36152L7.36136 4.26793L6.91942 3.82599L3.82583 6.91958L4.26777 7.36152Z"
        fill="#15A34A"
      />
    </svg>
  );
}
