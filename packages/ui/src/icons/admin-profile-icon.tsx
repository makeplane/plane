import * as React from "react";

import { ISvgIcons } from "./type";

export const AdminProfileIcon: React.FC<ISvgIcons> = ({ className = "text-current", ...rest }) => (
  <svg
    viewBox="0 0 24 24"
    className={`${className} stroke-2`}
    stroke="currentColor"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...rest}
  >
    <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" strokeLinecap="round" strokeLinejoin="round" />
    <path
      d="M8 19V18C8 16.9391 8.42143 15.9217 9.17157 15.1716C9.92172 14.4214 10.9391 14 12 14C13.0609 14 14.0783 14.4214 14.8284 15.1716C15.5786 15.9217 16 16.9391 16 18V19"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 14C13.6569 14 15 12.6569 15 11C15 9.34315 13.6569 8 12 8C10.3431 8 9 9.34315 9 11C9 12.6569 10.3431 14 12 14Z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
