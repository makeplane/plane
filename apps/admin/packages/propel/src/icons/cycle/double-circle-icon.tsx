import * as React from "react";

import { ISvgIcons } from "../type";

export const DoubleCircleIcon: React.FC<ISvgIcons> = ({ className = "text-current", ...rest }) => (
  <svg
    viewBox="0 0 24 24"
    className={`${className} stroke-2`}
    stroke="currentColor"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...rest}
  >
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5.625" />
  </svg>
);
