import React from "react";

import type { Props } from "./types";

export const CancelledStateIcon: React.FC<Props> = ({
  width = "20",
  height = "20",
  className,
  color = "#f2655a",
}) => (
  <svg
    width={width}
    height={height}
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 84.36 84.36"
  >
    <g id="Layer_2" data-name="Layer 2">
      <g id="Layer_1-2" data-name="Layer 1">
        <path
          className="cls-1"
          fill="none"
          strokeWidth={3}
          stroke={color}
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M20.45,7.69a39.74,39.74,0,0,1,43.43.54"
        />
        <path
          className="cls-1"
          fill="none"
          strokeWidth={3}
          stroke={color}
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M76.67,20.45a39.76,39.76,0,0,1-.53,43.43"
        />
        <path
          className="cls-1"
          fill="none"
          strokeWidth={3}
          stroke={color}
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M63.92,76.67a39.78,39.78,0,0,1-43.44-.53"
        />
        <path
          className="cls-1"
          fill="none"
          strokeWidth={3}
          stroke={color}
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M7.69,63.92a39.75,39.75,0,0,1,.54-43.44"
        />
        <circle className="cls-2" fill={color} cx="42.18" cy="42.18" r="31.04" />
        <path
          className="cls-3"
          fill="none"
          strokeWidth={3}
          stroke="#ffffff"
          strokeLinecap="square"
          strokeMiterlimit={10}
          d="M32.64,32.44q9.54,9.75,19.09,19.48"
        />
        <path
          className="cls-3"
          fill="none"
          strokeWidth={3}
          stroke="#ffffff"
          strokeLinecap="square"
          strokeMiterlimit={10}
          d="M32.64,51.92,51.73,32.44"
        />
      </g>
    </g>
  </svg>
);
