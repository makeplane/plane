import React from "react";

import type { Props } from "./types";

export const StartedStateIcon: React.FC<Props> = ({
  width = "20",
  height = "20",
  className,
  color = "#fbb040",
}) => (
  <svg
    width={width}
    height={height}
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 83.36 83.36"
  >
    <g id="Layer_2" data-name="Layer 2">
      <g id="Layer_1-2" data-name="Layer 1">
        <path
          className="cls-1"
          fill="none"
          stroke={color}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={3}
          d="M20,7.19a39.74,39.74,0,0,1,43.43.54"
        />
        <path
          className="cls-1"
          fill="none"
          stroke={color}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={3}
          d="M76.17,20a39.76,39.76,0,0,1-.53,43.43"
        />
        <path
          className="cls-1"
          fill="none"
          stroke={color}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={3}
          d="M63.42,76.17A39.78,39.78,0,0,1,20,75.64"
        />
        <path
          className="cls-1"
          fill="none"
          stroke={color}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={3}
          d="M7.19,63.42A39.75,39.75,0,0,1,7.73,20"
        />
        <path
          className="cls-2"
          fill={color}
          stroke={color}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={3}
          d="M42.32,41.21q9.57-14.45,19.13-28.9a35.8,35.8,0,0,0-39.09,0Z"
        />
        <path
          className="cls-2"
          fill={color}
          stroke={color}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={3}
          d="M42.32,41.7,61.45,70.6a35.75,35.75,0,0,1-39.09,0Z"
        />
      </g>
    </g>
  </svg>
);
