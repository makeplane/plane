import React from "react";
// types
import type { Props } from "../types";
// constants
import { issueGroupColors } from "constants/data";

export const BacklogStateIcon: React.FC<Props> = ({
  width = "14",
  height = "14",
  className,
  color = issueGroupColors["backlog"],
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
