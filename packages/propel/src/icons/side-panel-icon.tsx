import * as React from "react";

import type { ISvgIcons } from "./type";

export function SidePanelIcon({ className = "text-current", ...rest }: ISvgIcons) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`${className} stroke-2`}
      stroke="currentColor"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...rest}
    >
      <path
        d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 3H12V5V19V21H20C20.5523 21 21 20.1046 21 19V5C21 3.89543 20.5523 3 20 3Z"
        fill="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
