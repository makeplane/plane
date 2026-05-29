import * as React from "react";

import type { ISvgIcons } from "./type";

export function LeadIcon({ className = "text-current", ...rest }: ISvgIcons) {
  return (
    <svg className={className} viewBox="0 0 19 18" fill="none" xmlns="http://www.w3.org/2000/svg" {...rest}>
      <path
        d="M0.571533 9C0.571533 4.02944 4.60097 0 9.57153 0C14.5421 0 18.5715 4.02944 18.5715 9C18.5715 13.9706 14.5421 18 9.57153 18C4.60097 18 0.571533 13.9706 0.571533 9Z"
        fill="#3372FF"
      />
      <g clipPath="url(#clip0_8992_2377)">
        <circle cx="9.57153" cy="6.5" r="2.5" fill="#F5F5FF" />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M8.94653 9.625C6.53029 9.625 4.57153 11.5838 4.57153 14H9.57153H14.5715C14.5715 11.5838 12.6128 9.625 10.1965 9.625H9.82153L10.8215 13.0278L9.57153 14L8.32153 13.0278L9.32153 9.625H8.94653Z"
          fill="#F5F5FF"
        />
      </g>
      <defs>
        <clipPath id="clip0_8992_2377">
          <rect width="10" height="10" fill="white" transform="translate(4.57153 4)" />
        </clipPath>
      </defs>
    </svg>
  );
}
