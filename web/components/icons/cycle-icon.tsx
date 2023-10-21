import React from "react";

import type { Props } from "./types";

export const CyclesIcon: React.FC<Props> = ({
  width = "24",
  height = "24",
  className,
  color = "rgb(var(--color-text-200))",
}) => (
  <svg
    width={width}
    height={height}
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M6.5 17.5H3.5V20.5M20.5 20.5H17.5V17.5M17.5 6.5H20.5V3.5M3.5 3.5H6.5V6.5"
      stroke={color}
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M6.5 3.647C3.789 5.4355 2 8.509 2 12C2 12.51 2.038 13.0105 2.1115 13.5M13.5 21.888C13.0035 21.9626 12.5021 22.0001 12 22C8.509 22 5.4355 20.211 3.647 17.5M21.888 10.5C21.962 10.9895 22 11.49 22 12C22 15.491 20.211 18.5645 17.5 20.353M10.5 2.1115C10.9965 2.03703 11.4979 1.99976 12 2C15.491 2 18.5645 3.789 20.353 6.5"
      stroke={color}
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
