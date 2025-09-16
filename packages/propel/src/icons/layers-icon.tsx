import * as React from "react";

import { ISvgIcons } from "./type";

export const LayersIcon: React.FC<ISvgIcons> = ({ className = "text-current", ...rest }) => (
  <svg
    viewBox="0 0 24 24"
    className={`${className} stroke-2`}
    stroke="currentColor"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...rest}
  >
    <g clipPath="url(#clip0_7258_81938)">
      <path
        d="M16.5953 6.69606L16.6072 5.17376L6.85812 8.92381L6.85812 19.4238L9.00319 18.6961"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12.0953 3.69606L12.1072 2.17376L2.35812 5.92381L2.35812 16.4238L4.50319 15.6961"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M21.7438 17.9461L21.7511 7.44434L12.0021 11.1944L12.0021 21.6944L21.7438 17.9461Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
    <defs>
      <clipPath id="clip0_7258_81938">
        <rect width="24" height="24" fill="white" transform="translate(24) rotate(90)" />
      </clipPath>
    </defs>
  </svg>
);
