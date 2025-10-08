import * as React from "react";

import { ISvgIcons } from "./type";

export const ArchiveIcon: React.FC<ISvgIcons> = ({ className = "text-current", ...rest }) => (
  <svg
    viewBox="0 0 24 24"
    className={`${className} stroke-2`}
    stroke="currentColor"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...rest}
  >
    <path
      d="M21 3H3C2.44772 3 2 3.44772 2 4V7C2 7.55228 2.44772 8 3 8H21C21.5523 8 22 7.55228 22 7V4C22 3.44772 21.5523 3 21 3Z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M4 8V19C4 19.5304 4.21071 20.0391 4.58579 20.4142C4.96086 20.7893 5.46957 21 6 21H8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M20 8V19C20 19.5304 19.7893 20.0391 19.4142 20.4142C19.0391 20.7893 18.5304 21 18 21H16"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M15 18L12 21L9 18" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 21L12 12" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
