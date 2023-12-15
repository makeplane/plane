import * as React from "react";

import { ISvgIcons } from "./type";

export const RelatedIcon: React.FC<ISvgIcons> = ({ className = "text-current", ...rest }) => (
  <svg
    viewBox="0 0 24 24"
    className={`${className} stroke-2`}
    stroke="currentColor"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...rest}
  >
    <path
      d="M20 13V6C20 5.46957 19.7893 4.96086 19.4142 4.58579C19.0391 4.21071 18.5304 4 18 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H11"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M12.125 19.25L9 16.125L12.125 13" strokeLinecap="round" strokeLinejoin="round" />
    <path
      d="M20 22V18.1818C20 17.6032 19.7366 17.0482 19.2678 16.639C18.7989 16.2299 18.163 16 17.5 16H10"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
