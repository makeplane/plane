import * as React from "react";

import { ISvgIcons } from "./type";

export const SubscribeIcon: React.FC<ISvgIcons> = ({ className = "text-current", ...rest }) => (
  <svg
    viewBox="0 0 24 24"
    className={`${className} stroke-2`}
    stroke="currentColor"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...rest}
  >
    <path
      d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H12"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M15 5.1C15 4.54305 15.2107 4.0089 15.5858 3.61508C15.9609 3.22125 16.4696 3 17 3C17.5304 3 18.0391 3.22125 18.4142 3.61508C18.7893 4.0089 19 4.54305 19 5.1C19 7.55 20 8.25 20 8.25H14C14 8.25 15 7.55 15 5.1Z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16.25 11C16.3238 11 16.4324 11 16.5643 11C16.6963 11 16.8467 11 17 11C17.1533 11 17.3037 11 17.4357 11C17.5676 11 17.6762 11 17.75 11"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
