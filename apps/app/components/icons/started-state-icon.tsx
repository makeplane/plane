import React from "react";

import type { Props } from "./types";

export const StartedStateIcon: React.FC<Props> = ({
  width = "20",
  height = "20",
  className,
  color = "#fcbe1d",
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
    <path
      d="M14.2878 4.46695C13.0513 3.5087 11.5294 2.99227 9.96503 3.00009C8.40068 3.0079 6.88403 3.53951 5.65713 4.51006L10 10L14.2878 4.46695Z"
      fill={color}
    />
    <path
      d="M5.70047 15.5331C6.93701 16.4913 8.45889 17.0077 10.0232 16.9999C11.5876 16.9921 13.1043 16.4605 14.3312 15.4899L9.98828 10L5.70047 15.5331Z"
      fill={color}
    />
  </svg>
);
