import * as React from "react";

import type { ISvgIcons } from "./type";

export function LayerStackIcon({ className = "text-current", ...rest }: ISvgIcons) {
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
        d="M19 22H4C3.46957 22 2.96086 21.8119 2.58579 21.477C2.21071 21.1421 2 20.6879 2 20.2143V11.2857C2 10.8121 2.21071 10.3579 2.58579 10.023C2.96086 9.68814 3.46957 9.5 4 9.5H20C20.5304 9.5 21.0391 9.68814 21.4142 10.023C21.7893 10.3579 22 10.8121 22 11.2857V20.2143C22 20.6879 21.7893 21.1421 21.4142 21.477C21.0391 21.8119 20.5304 22 20 22H19Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4.5 9.5V6.82143C4.5 6.53727 4.65804 6.26475 4.93934 6.06381C5.22064 5.86288 5.60218 5.75 6 5.75H18C18.3978 5.75 18.7794 5.86288 19.0607 6.06381C19.342 6.26475 19.5 6.53727 19.5 6.82143V9.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7 4.5V2.71429C7 2.52485 7.10536 2.34316 7.29289 2.20921C7.48043 2.07525 7.73478 2 8 2H16C16.2652 2 16.5196 2.07525 16.7071 2.20921C16.8946 2.34316 17 2.52485 17 2.71429V4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
