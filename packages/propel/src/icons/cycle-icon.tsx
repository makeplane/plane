import * as React from "react";

import { ISvgIcons } from "./type";

export const CycleIcon: React.FC<ISvgIcons> = ({
  width = "16",
  height = "16",
  className = "text-current",
  color = "currentColor",
  ...rest
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...rest}
  >
    <g clipPath="url(#clip0_1612_7015)">
      <path
        d="M14.041 8C14.041 4.66339 11.3365 1.95818 8 1.95801C4.66328 1.95801 1.95801 4.66328 1.95801 8C1.95818 11.3365 4.66339 14.041 8 14.041C11.3364 14.0408 14.0408 11.3364 14.041 8ZM15.291 8C15.2908 12.0268 12.0268 15.2908 8 15.291C3.97303 15.291 0.708184 12.0269 0.708008 8C0.708008 3.97292 3.97292 0.708008 8 0.708008C12.0269 0.708184 15.291 3.97303 15.291 8Z"
        fill={color}
      />
      <path
        d="M7.99951 12.3337C10.3928 12.3337 12.3328 10.3936 12.3328 8.00033C12.3328 5.60709 10.3928 3.66699 7.99951 3.66699V12.3337Z"
        fill={color}
      />
    </g>
    <defs>
      <clipPath id="clip0_1612_7015">
        <rect width="16" height="16" fill="white" />
      </clipPath>
    </defs>
  </svg>
);
