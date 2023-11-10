import React from "react";

import type { Props } from "./types";

export const CompletedCycleIcon: React.FC<Props> = ({ width = "24", height = "24", className, color = "black" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" height={height} width={width} className={className}>
    <path
      d="m21.65 36.6-6.9-6.85 2.1-2.1 4.8 4.7 9.2-9.2 2.1 2.15ZM6 44V7h6.25V4h3.25v3h17V4h3.25v3H42v37Zm3-3h30V19.5H9Zm0-24.5h30V10H9Zm0 0V10v6.5Z"
      fill={color}
    />
  </svg>
);
