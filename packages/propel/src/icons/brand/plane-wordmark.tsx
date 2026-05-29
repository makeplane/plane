import * as React from "react";

import type { ISvgIcons } from "../type";

export function PlaneWordmark({ width = "120", height = "32", className }: ISvgIcons) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 120 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="wordmarkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3f76ff" />
          <stop offset="100%" stopColor="#00f0ff" />
        </linearGradient>
      </defs>
      <text
        x="0"
        y="21"
        fontFamily="Outfit, system-ui, -apple-system, sans-serif"
        fontSize="19"
        fontWeight="900"
        letterSpacing="-0.05em"
        fill="#1b6ec2"
      >
        WinSecOps
      </text>
    </svg>
  );
}
