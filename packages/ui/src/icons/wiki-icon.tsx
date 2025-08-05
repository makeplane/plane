import * as React from "react";

import { ISvgIcons } from "./type";

export const WikiIcon: React.FC<ISvgIcons> = ({ width = "16", height = "16", className, color = "currentColor" }) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 16 16"
    fill={color}
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <g clipPath="url(#clip0_888_35566)">
      <path
        d="M15.558 6.93332L9.06623 0.441504C8.47755 -0.147168 7.5229 -0.147168 6.93332 0.441504L0.441504 6.93332C-0.147168 7.52199 -0.147168 8.47664 0.441504 9.06623L6.93332 15.558C7.52199 16.1467 8.47664 16.1467 9.06623 15.558L15.558 9.06623C16.1467 8.47755 16.1467 7.5229 15.558 6.93332ZM10.7629 9.65855C10.7629 10.2682 10.2691 10.762 9.65946 10.762H6.341C5.73133 10.762 5.23758 10.2682 5.23758 9.65855V6.34008C5.23758 5.73042 5.73133 5.23667 6.341 5.23667H9.65946C10.2691 5.23667 10.7629 5.73042 10.7629 6.34008V9.65855Z"
        fill={color}
      />
    </g>
    <defs>
      <clipPath id="clip0_888_35566">
        <rect width="16" height="16" fill="white" />
      </clipPath>
    </defs>
  </svg>
);
