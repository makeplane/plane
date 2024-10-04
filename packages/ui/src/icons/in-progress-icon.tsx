import * as React from "react";

import { ISvgIcons } from "./type";

export const InProgressState: React.FC<ISvgIcons> = ({ width = "10", height = "11", className, color }) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 12 13"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle cx="6" cy="6.5" r="4.4" stroke="#EA8900" stroke-width="1.2" />
    <circle cx="6" cy="6.5" r="2.4" stroke="#EA8900" stroke-width="1.2" stroke-dasharray="4 4" />
  </svg>
);
