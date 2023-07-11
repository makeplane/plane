import React from "react";

import type { Props } from "./types";

export const BacklogStateIcon: React.FC<Props> = ({
  width = "20",
  height = "20",
  className,
  color = "rgb(var(--color-text-200))",
}) => (
  <svg
    width={width}
    height={height}
    className={className}
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="10" cy="10" r="9" stroke={color} strokeLinecap="round" strokeDasharray="4 4" />
  </svg>
);
