import * as React from "react";

import type { ISvgIcons } from "./type";

export function Intake({ className = "text-current", ...rest }: ISvgIcons) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={`${className}`}
      stroke="currentColor"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      <path d="M12.1599 3.59961V9.60688L8.04358 12.0796V6.04325L12.1599 3.59961Z" />
      <path d="M5.98547 10.8657V4.82938L10.1018 2.38574" />
      <path d="M3.89087 9.60695V3.57059L8.00723 1.12695" />
      <path d="M1.06909 8.77051V13.3887C1.06909 14.1814 1.71636 14.8287 2.50909 14.8287H13.4909C14.2836 14.8287 14.9309 14.1814 14.9309 13.3887V8.77051" />
    </svg>
  );
}
