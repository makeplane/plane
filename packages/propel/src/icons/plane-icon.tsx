import * as React from "react";

import { ISvgIcons } from "./type";

export const PlaneNewIcon: React.FC<ISvgIcons> = ({
  width = "16",
  height = "16",
  className,
  color = "currentColor",
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 16 16"
    fill={color}
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <g clipPath="url(#clip0_888_35560)">
      <path
        d="M5.15383 9.50566V5.15381H1.34152C0.601228 5.15381 0 5.75399 0 6.49533V14.6595C0 15.3998 0.600183 16.001 1.34152 16.001H9.50568C10.246 16.001 10.8472 15.4008 10.8472 14.6595V10.8461H6.49536C5.75506 10.8461 5.15383 10.246 5.15383 9.50461V9.50566Z"
        fill={color}
      />
      <path
        d="M14.66 0H6.49582C5.75553 0 5.1543 0.600183 5.1543 1.34152V5.15488H9.50615C10.2464 5.15488 10.8477 5.75506 10.8477 6.49641V10.8483H14.661C15.4013 10.8483 16.0026 10.2481 16.0026 9.50673V1.34152C16.0026 0.601229 15.4024 0 14.661 0H14.66Z"
        fill={color}
      />
    </g>
    <defs>
      <clipPath id="clip0_888_35560">
        <rect width="16" height="16" fill="white" />
      </clipPath>
    </defs>
  </svg>
);
