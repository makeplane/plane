import React from "react";

import type { Props } from "./types";

export const ModuleIcon: React.FC<Props> = ({ width = "24", height = "24", className, color = "#F15B5B" }) => (
  <svg
    width={width}
    height={height}
    className={className}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12.6667 2H3.33333C2.59695 2 2 2.59695 2 3.33333V12.6667C2 13.403 2.59695 14 3.33333 14H12.6667C13.403 14 14 13.403 14 12.6667V3.33333C14 2.59695 13.403 2 12.6667 2Z"
      stroke="#F15B5B"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M5.84925 4.66667H4.81221C4.73039 4.66667 4.66406 4.733 4.66406 4.81482V5.85185C4.66406 5.93367 4.73039 6 4.81221 6H5.84925C5.93107 6 5.9974 5.93367 5.9974 5.85185V4.81482C5.9974 4.733 5.93107 4.66667 5.84925 4.66667Z"
      fill={color}
      stroke="#F15B5B"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M5.84925 10H4.81221C4.73039 10 4.66406 10.0663 4.66406 10.1481V11.1852C4.66406 11.267 4.73039 11.3333 4.81221 11.3333H5.84925C5.93107 11.3333 5.9974 11.267 5.9974 11.1852V10.1481C5.9974 10.0663 5.93107 10 5.84925 10Z"
      fill={color}
      stroke="#F15B5B"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M11.1852 4.66667H10.1481C10.0663 4.66667 10 4.733 10 4.81482V5.85185C10 5.93367 10.0663 6 10.1481 6H11.1852C11.267 6 11.3333 5.93367 11.3333 5.85185V4.81482C11.3333 4.733 11.267 4.66667 11.1852 4.66667Z"
      fill={color}
      stroke="#F15B5B"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M11.1852 10H10.1481C10.0663 10 10 10.0663 10 10.1481V11.1852C10 11.267 10.0663 11.3333 10.1481 11.3333H11.1852C11.267 11.3333 11.3333 11.267 11.3333 11.1852V10.1481C11.3333 10.0663 11.267 10 11.1852 10Z"
      fill={color}
      stroke="#F15B5B"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
