import * as React from "react";

import { ISvgIcons } from "../type";

export const RecurringWorkItemIcon: React.FC<ISvgIcons> = ({ className = "text-current", ...rest }) => (
  <svg className={className} viewBox="0 0 15 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...rest}>
    <g clip-path="url(#clip0_328_54809)">
      <path
        d="M9.46763 8.06641H6.46777"
        stroke="currentColor"
        stroke-width="1.13333"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M9.46763 5.66602H6.46777"
        stroke="currentColor"
        stroke-width="1.13333"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M11.8677 11.0676V3.86791C11.8677 3.54967 11.7413 3.24446 11.5163 3.01942C11.2912 2.79439 10.986 2.66797 10.6678 2.66797H2.86816"
        stroke="currentColor"
        stroke-width="1.13333"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M5.26828 13.4674H12.4679C12.7862 13.4674 13.0914 13.341 13.3164 13.116C13.5414 12.891 13.6679 12.5857 13.6679 12.2675V11.6675C13.6679 11.5084 13.6047 11.3558 13.4921 11.2433C13.3796 11.1308 13.227 11.0676 13.0679 11.0676H7.06819C6.90907 11.0676 6.75647 11.1308 6.64395 11.2433C6.53143 11.3558 6.46822 11.5084 6.46822 11.6675V12.2675C6.46822 12.5857 6.3418 12.891 6.11677 13.116C5.89174 13.341 5.58653 13.4674 5.26828 13.4674ZM5.26828 13.4674C4.95004 13.4674 4.64483 13.341 4.41979 13.116C4.19476 12.891 4.06834 12.5857 4.06834 12.2675V3.86791C4.06834 3.54967 3.94192 3.24446 3.71689 3.01942C3.49185 2.79439 3.18664 2.66797 2.8684 2.66797C2.55015 2.66797 2.24494 2.79439 2.01991 3.01942C1.79488 3.24446 1.66846 3.54967 1.66846 3.86791V5.06785C1.66846 5.22697 1.73167 5.37958 1.84418 5.49209C1.9567 5.60461 2.10931 5.66782 2.26843 5.66782H4.06834"
        stroke="currentColor"
        stroke-width="1.13333"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </g>
    <defs>
      <clipPath id="clip0_328_54809">
        <rect width="14.3993" height="14.3993" fill="white" transform="translate(0.468262 0.867188)" />
      </clipPath>
    </defs>
  </svg>
);
