import * as React from "react";

import type { ISvgIcons } from "./type";

export function CreateIcon({ className = "text-current", ...rest }: ISvgIcons) {
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
        d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H12"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M16 5H22" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 2V8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
