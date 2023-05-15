import React from "react";

import type { Props } from "./types";

export const TriangleIcon: React.FC<Props> = ({ width, height, className, color }) => (
  <svg
    width={width}
    height={height}
    className={className}
    viewBox="0 0 11 10"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M0.454154 9.66615C0.279154 9.66615 0.150335 9.5908 0.067696 9.4401C-0.0149429 9.28941 -0.0076512 9.14115 0.089571 8.99531L5.14999 0.930729C5.23749 0.794618 5.35902 0.726562 5.51457 0.726562C5.67013 0.726562 5.79165 0.794618 5.87915 0.930729L10.9104 8.99531C10.9979 9.14115 11.0028 9.28941 10.925 9.4401C10.8472 9.5908 10.7208 9.66615 10.5458 9.66615H0.454154ZM1.22707 8.79115H9.7729L5.51457 2.0099L1.22707 8.79115Z"
      fill={color}
    />
  </svg>
);
