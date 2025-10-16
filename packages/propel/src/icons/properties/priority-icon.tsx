import * as React from "react";

import { ISvgIcons } from "../type";

export const PriorityPropertyIcon: React.FC<ISvgIcons> = ({
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
    <path
      d="M3.375 13.334V10.667C3.375 10.3218 3.65482 10.042 4 10.042C4.34518 10.042 4.625 10.3218 4.625 10.667V13.334C4.62482 13.679 4.34507 13.959 4 13.959C3.65493 13.959 3.37518 13.679 3.375 13.334ZM7.375 13.334V6.66699C7.375 6.32181 7.65482 6.04199 8 6.04199C8.34518 6.04199 8.625 6.32181 8.625 6.66699V13.334C8.62482 13.679 8.34507 13.959 8 13.959C7.65493 13.959 7.37518 13.679 7.375 13.334ZM11.375 13.334V2.66699C11.375 2.32181 11.6548 2.04199 12 2.04199C12.3452 2.04199 12.625 2.32181 12.625 2.66699V13.334C12.6248 13.679 12.3451 13.959 12 13.959C11.6549 13.959 11.3752 13.679 11.375 13.334Z"
      fill={color}
    />
  </svg>
);
