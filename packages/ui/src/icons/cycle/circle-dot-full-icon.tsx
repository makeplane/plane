import * as React from "react";

import { ISvgIcons } from "../type";

export const CircleDotFullIcon: React.FC<ISvgIcons> = ({ className = "text-current", ...rest }) => (
  <svg viewBox="0 0 16 16" className={`${className} stroke-1`} fill="none" xmlns="http://www.w3.org/2000/svg" {...rest}>
    <circle cx="8.33333" cy="8.33333" r="5.33333" stroke="currentColor" stroke-linecap="round" />
    <circle cx="8.33333" cy="8.33333" r="4.33333" fill="currentColor" />
  </svg>
);
