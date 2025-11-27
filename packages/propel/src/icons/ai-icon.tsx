import * as React from "react";

import type { ISvgIcons } from "./type";

export function AiIcon({ width = "16", height = "16", className, color = "currentColor" }: ISvgIcons) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 16 16"
      fill={color}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <g clipPath="url(#clip0_888_35571)">
        <path
          d="M14.2082 0H1.79185C0.801553 0 0 0.801553 0 1.79185V14.2093C0 15.1984 0.801553 16.0012 1.79185 16.0012H14.2093C15.1984 16.0012 16.0012 15.1996 16.0012 14.2093V1.79185C16.0012 0.802748 15.1996 0 14.2093 0H14.2082ZM13.1032 11.5276C13.1032 12.3984 12.3972 13.1032 11.5276 13.1032H4.47245C3.60161 13.1032 2.89682 12.3972 2.89682 11.5276V4.47245C2.89682 3.60161 3.60281 2.89682 4.47245 2.89682H11.5276C12.3984 2.89682 13.1032 3.60281 13.1032 4.47245V11.5276Z"
          fill={color}
        />
        <path
          d="M9.61291 4.94336H6.38759C5.58996 4.94336 4.94336 5.58996 4.94336 6.38759V9.61291C4.94336 10.4105 5.58996 11.0571 6.38759 11.0571H9.61291C10.4105 11.0571 11.0571 10.4105 11.0571 9.61291V6.38759C11.0571 5.58996 10.4105 4.94336 9.61291 4.94336Z"
          fill={color}
        />
      </g>
      <defs>
        <clipPath id="clip0_888_35571">
          <rect width="16" height="16" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}
