import React from "react";

import type { Props } from "./types";

export const CompletedStateIcon: React.FC<Props> = ({
  width = "20",
  height = "20",
  className,
  color = "#438af3",
}) => (
  <svg
    width={width}
    height={height}
    className={className}
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle
      cx="10"
      cy="10"
      r="9"
      stroke={color}
      strokeLinecap="round"
      strokeDasharray="0 20 0 10"
    />
    <circle cx="10" cy="10" r="7" fill={color} />
    <path
      d="M13 8.33328L9 12.3333L7.16666 10.4999L7.63666 10.0299L9 11.3899L12.53 7.86328L13 8.33328Z"
      fill="white"
    />
  </svg>
);
