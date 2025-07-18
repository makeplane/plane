import * as React from "react";
// types
import { ISvgIcons } from "../type";

export const BasicPieChartIcon: React.FC<ISvgIcons> = ({ height = "24", width = "24", className = "", ...rest }) => (
  <svg
    width={width}
    height={height}
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...rest}
  >
    <g clip-path="url(#clip0_26787_687261)">
      <path
        d="M24 12C24 9.92212 23.4605 7.87985 22.4342 6.0731C21.4079 4.26636 19.93 2.75706 18.1453 1.69296C16.3606 0.628857 14.3301 0.0464191 12.2527 0.00266117C10.1753 -0.0410967 8.12211 0.455325 6.29415 1.44333L12 12H24Z"
        fill="currentColor"
      />
      <path
        d="M0.35035 14.8785C1.05394 17.726 2.77608 20.2172 5.19141 21.8814C7.60673 23.5457 10.5479 24.2676 13.4593 23.9109C16.3707 23.5542 19.0506 22.1436 20.9928 19.9455C22.9349 17.7474 24.0046 14.9141 24 11.9809L12 12L0.35035 14.8785Z"
        fill="currentColor"
        opacity={0.7}
      />
      <path
        d="M6.3159 1.4316C3.97352 2.69143 2.11605 4.69374 1.03532 7.12395C-0.0454067 9.55417 -0.288146 12.2746 0.345241 14.8577L12 12L6.3159 1.4316Z"
        fill="currentColor"
        opacity={0.4}
      />
    </g>
    <defs>
      <clipPath id="clip0_26787_687261">
        <rect width="24" height="24" fill="white" />
      </clipPath>
    </defs>
  </svg>
);
