import * as React from "react";

import type { ISvgIcons } from "./type";

export function SuspendedUserIcon({ className, ...rest }: ISvgIcons) {
  return (
    <svg viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...rest}>
      <g clipPath="url(#clip0_806_120890)">
        <path
          d="M3 13C3 12.304 3.18158 11.6201 3.52681 11.0158C3.87204 10.4115 4.36897 9.90774 4.9685 9.55428C5.56802 9.20082 6.24939 9.00989 6.94529 9.00037C7.64119 8.99086 8.32753 9.16307 8.9365 9.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M7 9C8.38071 9 9.5 7.88071 9.5 6.5C9.5 5.11929 8.38071 4 7 4C5.61929 4 4.5 5.11929 4.5 6.5C4.5 7.88071 5.61929 9 7 9Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M10.5 11L13 13.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M13 11L10.5 13.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <defs>
        <clipPath id="clip0_806_120890">
          <path
            d="M2 4.5C2 3.39543 2.89543 2.5 4 2.5H12C13.1046 2.5 14 3.39543 14 4.5V12.5C14 13.6046 13.1046 14.5 12 14.5H4C2.89543 14.5 2 13.6046 2 12.5V4.5Z"
            fill="white"
          />
        </clipPath>
      </defs>
    </svg>
  );
}
