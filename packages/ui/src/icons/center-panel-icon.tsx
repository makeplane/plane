import * as React from "react";

import { ISvgIcons } from "./type";

export const CenterPanelIcon: React.FC<ISvgIcons> = ({ className = "text-current", ...rest }) => (
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
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path
      d="M15.1111 8.00009H8.8001C8.33334 8.00007 8.00003 8.0001 8.00012 8.88897V15.1111C8.00012 16 8.00012 16 8.8001 16H15.1111C16 16 16 16 16 15.1111V8.88897C16 8.00009 16 8.00009 15.1111 8.00009H15.1111Z"
      fill="currentColor"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
);
