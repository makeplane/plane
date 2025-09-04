import * as React from "react";
// types
import { ISvgIcons } from "../type";

export const BasicBarChartIcon: React.FC<ISvgIcons> = ({ height = "24", width = "24", className = "", ...rest }) => (
  <svg
    width={width}
    height={height}
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...rest}
  >
    <rect y="6.33398" width="4" height="17.3333" rx="0.5" fill="currentColor" />
    <rect x="13.3333" y="11.666" width="4" height="12" rx="0.5" fill="currentColor" />
    <rect x="6.66675" y="1" width="4" height="22.6667" rx="0.5" fill="currentColor" />
    <rect x="20" y="5" width="4" height="18.6667" rx="0.5" fill="currentColor" />
  </svg>
);

export const GroupedBarChartIcon: React.FC<ISvgIcons> = ({ height = "24", width = "24", className = "", ...rest }) => (
  <svg
    width={width}
    height={height}
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...rest}
  >
    <rect x="2" y="9" width="4" height="15" rx="0.5" fill="currentColor" opacity={0.7} />
    <rect x="6" width="4" height="24" rx="0.5" fill="currentColor" />
    <rect x="14" y="12" width="4" height="12" rx="0.5" fill="currentColor" opacity={0.7} />
    <rect x="18" y="5" width="4" height="19" rx="0.5" fill="currentColor" />
  </svg>
);

export const StackedBarChartIcon: React.FC<ISvgIcons> = ({ height = "24", width = "24", className = "", ...rest }) => (
  <svg
    width={width}
    height={height}
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...rest}
  >
    <path
      d="M6.6665 1.5C6.6665 1.22386 6.89036 1 7.1665 1H10.1665C10.4426 1 10.6665 1.22386 10.6665 1.5V6.3333H6.6665V1.5Z"
      fill="currentColor"
      opacity={0.4}
    />
    <path
      d="M6.6665 14.334H10.6665V23.1673C10.6665 23.4434 10.4426 23.6673 10.1665 23.6673H7.1665C6.89036 23.6673 6.6665 23.4434 6.6665 23.1673V14.334Z"
      fill="currentColor"
    />
    <rect x="6.6665" y="6.33398" width="3.99997" height="7.99995" fill="currentColor" opacity={0.7} />
    <path
      d="M0 8.16602C0 7.88987 0.223858 7.66602 0.5 7.66602H3.49997C3.77612 7.66602 3.99997 7.88987 3.99997 8.16602V11.2215H0V8.16602Z"
      fill="currentColor"
      opacity={0.4}
    />
    <path
      d="M0 17.4434H3.99997V23.1655C3.99997 23.4417 3.77612 23.6655 3.49997 23.6655H0.5C0.223857 23.6655 0 23.4417 0 23.1655V17.4434Z"
      fill="currentColor"
    />
    <rect y="11.2227" width="3.99997" height="6.22218" fill="currentColor" opacity={0.7} />
    <path
      d="M13.333 12.168C13.333 11.8918 13.5569 11.668 13.833 11.668H16.833C17.1091 11.668 17.333 11.8918 17.333 12.168V14.3346H13.333V12.168Z"
      fill="currentColor"
      opacity={0.4}
    />
    <path
      d="M13.333 19.668H17.333V23.1679C17.333 23.4441 17.1091 23.6679 16.833 23.6679H13.833C13.5569 23.6679 13.333 23.4441 13.333 23.1679V19.668Z"
      fill="currentColor"
    />
    <rect x="13.333" y="14.334" width="3.99997" height="5.3333" fill="currentColor" opacity={0.7} />
    <path
      d="M20 4.16602C20 3.88987 20.2239 3.66602 20.5 3.66602H23.5C23.7761 3.66602 24 3.88987 24 4.16602V6.33266H20V4.16602Z"
      fill="currentColor"
      opacity={0.4}
    />
    <path
      d="M20 18.332H24V23.1653C24 23.4415 23.7761 23.6653 23.5 23.6653H20.5C20.2239 23.6653 20 23.4415 20 23.1653V18.332Z"
      fill="currentColor"
    />
    <rect x="20" y="6.33203" width="3.99997" height="11.9999" fill="currentColor" opacity={0.7} />
  </svg>
);
