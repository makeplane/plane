import * as React from "react";

import { ISvgIcons } from "./type";

export const FullScreenPanelIcon: React.FC<ISvgIcons> = ({ className = "text-current", ...rest }) => (
  <svg
    viewBox="0 0 24 24"
    className={`${className} stroke-2`}
    stroke="currentColor"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...rest}
  >
    <path
      d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16.6667 6.00001H7.20015C6.50001 5.99999 6.00005 6.00003 6.00017 7.33335C6.00027 8.4402 6.00021 13.8198 6.00018 15.8823L6.00017 16.6667C6.00017 18 6.00017 18 7.20015 18H16.6667C18 18 18 18 18 16.6667V7.33335C18 6.00001 18 6.00001 16.6667 6.00001H16.6667Z"
      fill="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
