import * as React from "react";

import { ISvgIcons } from "./type";

export const AtRiskIcon: React.FC<ISvgIcons> = ({ width = "16", height = "16" }) => (
  <svg width={width} height={height} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clip-path="url(#clip0_365_7561)">
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M2.03658 7.33335H2.66663C3.03482 7.33335 3.33329 7.63183 3.33329 8.00002C3.33329 8.36821 3.03482 8.66669 2.66663 8.66669H2.03658C2.36821 11.6667 4.91159 14 7.99996 14C11.0883 14 13.6317 11.6667 13.9633 8.66669H13.3333C12.9651 8.66669 12.6666 8.36821 12.6666 8.00002C12.6666 7.63183 12.9651 7.33335 13.3333 7.33335H13.9633C13.6317 4.33339 11.0883 2.00002 7.99996 2.00002C4.91159 2.00002 2.36821 4.33339 2.03658 7.33335ZM0.666626 8.00002C0.666626 3.94993 3.94987 0.666687 7.99996 0.666687C12.05 0.666687 15.3333 3.94993 15.3333 8.00002C15.3333 12.0501 12.05 15.3334 7.99996 15.3334C3.94987 15.3334 0.666626 12.0501 0.666626 8.00002ZM7.99996 4.66669C8.36815 4.66669 8.66663 4.96516 8.66663 5.33335V8.00002C8.66663 8.36821 8.36815 8.66669 7.99996 8.66669C7.63177 8.66669 7.33329 8.36821 7.33329 8.00002V5.33335C7.33329 4.96516 7.63177 4.66669 7.99996 4.66669ZM7.33329 10.6667C7.33329 10.2985 7.63177 10 7.99996 10H8.00663C8.37482 10 8.67329 10.2985 8.67329 10.6667C8.67329 11.0349 8.37482 11.3334 8.00663 11.3334H7.99996C7.63177 11.3334 7.33329 11.0349 7.33329 10.6667Z"
        fill="#CC7700"
      />
    </g>
    <defs>
      <clipPath id="clip0_365_7561">
        <rect width="16" height="16" fill="white" />
      </clipPath>
    </defs>
  </svg>
);
