import * as React from "react";

import { ISvgIcons } from "./type";

export const UserGroupIcon: React.FC<ISvgIcons> = ({ className = "text-current", ...rest }) => (
  <svg
    viewBox="0 0 24 24"
    className={`${className} stroke-2`}
    stroke="currentColor"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...rest}
  >
    <path
      d="M18 19C18 17.4087 17.3679 15.8826 16.2426 14.7574C15.1174 13.6321 13.5913 13 12 13C10.4087 13 8.88258 13.6321 7.75736 14.7574C6.63214 15.8826 6 17.4087 6 19"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 13C14.2091 13 16 11.2091 16 9C16 6.79086 14.2091 5 12 5C9.79086 5 8 6.79086 8 9C8 11.2091 9.79086 13 12 13Z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M23 18C23 16.636 22.4732 15.3279 21.5355 14.3635C20.5979 13.399 19.3261 12.8571 18 12.8571C18.8841 12.8571 19.7319 12.4959 20.357 11.8529C20.9821 11.21 21.3333 10.3379 21.3333 9.42857C21.3333 8.51926 20.9821 7.64719 20.357 7.00421C19.7319 6.36122 18.8841 6 18 6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M1 18C1 16.636 1.52678 15.3279 2.46447 14.3635C3.40215 13.399 4.67392 12.8571 6 12.8571C5.11595 12.8571 4.2681 12.4959 3.64298 11.8529C3.01786 11.21 2.66667 10.3379 2.66667 9.42857C2.66667 8.51926 3.01786 7.64719 3.64298 7.00421C4.2681 6.36122 5.11595 6 6 6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
