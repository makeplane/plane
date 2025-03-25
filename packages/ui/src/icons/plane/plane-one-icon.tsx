import * as React from "react";

import { ISvgIcons } from "../type";

export const PlaneOneIcon: React.FC<ISvgIcons> = ({ className = "text-current", ...rest }) => (
  <svg className={className} viewBox="0 0 26 13" fill="none" xmlns="http://www.w3.org/2000/svg" {...rest}>
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M11.9835 0.0722646L3.98907 0.0722653L3.98907 4.06955L7.98645 4.06955L7.98645 8.06715L11.9835 8.06715L11.9835 0.0722646ZM3.98876 4.07175L-0.00830043 4.07175L-0.00830008 8.06008L3.98876 8.06008L3.98876 4.07175ZM3.99812 8.06881L7.98624 8.06881L7.98624 12.0661L3.99813 12.0661L3.99812 8.06881Z"
      fill="currentColor"
    />
    <rect x="18.9126" y="0.0664062" width="3.39301" height="8.5961" fill="currentColor" />
    <rect x="15.5203" y="8.66406" width="3.39301" height="3.3932" fill="currentColor" />
    <rect x="15.52" y="0.0664062" width="3.39301" height="3.3932" fill="currentColor" />
    <rect x="22.3066" y="8.66406" width="3.39301" height="3.3932" fill="currentColor" />
  </svg>
);
