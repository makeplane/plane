import * as React from "react";

import { ISvgIcons } from "./type";

export const HomeIcon: React.FC<ISvgIcons> = ({ width = "16", height = "16", className, color = "currentColor" }) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 16 16"
    fill={color}
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M14.1063 6.74052L9.26937 1.90354C8.57116 1.20533 7.43885 1.20533 6.74064 1.90354L1.90367 6.74052C1.20545 7.43873 1.20545 8.57103 1.90367 9.26925L6.74064 14.1062C7.43885 14.8044 8.57116 14.8044 9.26937 14.1062L14.1063 9.26925C14.8046 8.57103 14.8046 7.43873 14.1063 6.74052ZM10.3649 9.74697C10.3649 10.0877 10.0885 10.364 9.7471 10.364H6.26291C5.92223 10.364 5.64509 10.0877 5.64509 9.74697V6.26203C5.64509 5.92134 5.92146 5.6442 6.26291 5.6442H9.7471C10.0885 5.6442 10.3649 5.92057 10.3649 6.26203V9.74697Z"
      fill={color}
    />
  </svg>
);
