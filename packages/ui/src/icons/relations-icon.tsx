import * as React from "react";

import { ISvgIcons } from "./type";

export const RelationsIcon: React.FC<ISvgIcons> = ({ className = "text-current", ...rest }) => (
  <svg
    viewBox="0 0 16 16"
    className={`${className}`}
    stroke="currentColor"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    // strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...rest}
  >
    <path d="M7.99998 4.66536C8.92045 4.66536 9.66665 3.91917 9.66665 2.9987C9.66665 2.07822 8.92045 1.33203 7.99998 1.33203C7.07951 1.33203 6.33331 2.07822 6.33331 2.9987C6.33331 3.91917 7.07951 4.66536 7.99998 4.66536Z" />
    <path d="M6.80001 4.19922L4.20001 6.79922" />
    <path d="M2.99998 9.66536C3.92045 9.66536 4.66665 8.91917 4.66665 7.9987C4.66665 7.07822 3.92045 6.33203 2.99998 6.33203C2.07951 6.33203 1.33331 7.07822 1.33331 7.9987C1.33331 8.91917 2.07951 9.66536 2.99998 9.66536Z" />
    <path d="M4.66669 8H11.3334" />
    <path d="M13 9.66536C13.9205 9.66536 14.6666 8.91917 14.6666 7.9987C14.6666 7.07822 13.9205 6.33203 13 6.33203C12.0795 6.33203 11.3333 7.07822 11.3333 7.9987C11.3333 8.91917 12.0795 9.66536 13 9.66536Z" />
    <path d="M9.20001 11.7992L11.8 9.19922" />
    <path d="M7.99998 14.6654C8.92045 14.6654 9.66665 13.9192 9.66665 12.9987C9.66665 12.0782 8.92045 11.332 7.99998 11.332C7.07951 11.332 6.33331 12.0782 6.33331 12.9987C6.33331 13.9192 7.07951 14.6654 7.99998 14.6654Z" />
  </svg>
);
