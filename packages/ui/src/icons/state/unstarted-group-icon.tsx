import React from "react";

import { ISvgIcons } from "../type";

export const UnstartedGroupIcon: React.FC<ISvgIcons> = ({
  className = "",
  color = "#3a3a3a",
  height = "20",
  width = "20",
  ...rest
}) => (
  <svg
    height={height}
    width={width}
    className={className}
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    {...rest}
  >
    <circle cx="8" cy="8" r="7.4" stroke={color} strokeWidth="1.2" />
  </svg>
);
