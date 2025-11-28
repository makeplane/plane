import * as React from "react";

import type { ISvgIcons } from "./type";

export function UserActivityIcon({ className = "text-current", ...rest }: ISvgIcons) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`${className} stroke-2`}
      stroke="currentColor"
      fill="none"
      strokeWidth="1.5"
      xmlns="http://www.w3.org/2000/svg"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      <path d="M10.5 13C12.9853 13 15 10.9853 15 8.5C15 6.01472 12.9853 4 10.5 4C8.01472 4 6 6.01472 6 8.5C6 10.9853 8.01472 13 10.5 13Z" />
      <path d="M13.9062 13.5903C12.8368 13.1001 11.661 12.8876 10.4877 12.9725C9.31437 13.0574 8.18144 13.437 7.19379 14.0761C6.20613 14.7152 5.39567 15.5931 4.83744 16.6286C4.2792 17.6641 3.99124 18.8237 4.0002 20" />
      <path d="M21 16.5H19.6L18.2 20L16.8 13L15.4 16.5H14" />
    </svg>
  );
}
