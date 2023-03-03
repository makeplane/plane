import React from "react";

import type { Props } from "./types";

export const HeartbeatIcon: React.FC<Props> = ({
  width = "24",
  height = "24",
  color = "#858E96",
  className,
}) => (
  <svg
    width={width}
    height={height}
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M2 8H5L6 4L8.66667 12L10 6L11 8H14"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
