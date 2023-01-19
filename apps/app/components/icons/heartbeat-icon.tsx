import React from "react";

import type { Props } from "./types";

export const HeartbeatIcon: React.FC<Props> = ({ width = "24", height = "24", className }) => (
    <svg
      width={width}
      height={height}
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3 12H7.5L9 6L13 18L15 9L16.5 12H21"
        stroke="black"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
