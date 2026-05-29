import * as React from "react";

import type { ISvgIcons } from "../type";

export function CompletedGroupIcon({
  className = "",
  color = "#46A758",
  height = "20",
  width = "20",
  ...rest
}: ISvgIcons) {
  return (
    <svg
      height={height}
      width={width}
      className={className}
      viewBox="0 0 16 16"
      xmlns="http://www.w3.org/2000/svg"
      {...rest}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8 15C11.866 15 15 11.866 15 8C15 4.13401 11.866 1 8 1C4.13401 1 1 4.13401 1 8C1 11.866 4.13401 15 8 15ZM11.3587 6.18828C11.6007 5.85214 11.5244 5.38343 11.1882 5.14141C10.8521 4.89938 10.3834 4.97568 10.1414 5.31183L7.03706 9.62335L5.25956 7.97751C4.95563 7.69609 4.4811 7.71434 4.19968 8.01828C3.91826 8.32221 3.93651 8.79673 4.24045 9.07815L6.64045 11.3004C6.79816 11.4464 7.01095 11.5178 7.22481 11.4963C7.43868 11.4749 7.63307 11.3627 7.75865 11.1883L11.3587 6.18828Z"
        fill={color}
      />
    </svg>
  );
}
