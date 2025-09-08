import * as React from "react";

import { ISvgIcons } from "../type";

export const CircleDotFullIcon: React.FC<ISvgIcons> = ({ className = "text-current", ...rest }) => (
  <svg viewBox="0 0 24 24" className={`${className} stroke-1`} fill="none" xmlns="http://www.w3.org/2000/svg" {...rest}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <circle cx="12" cy="12" r="6.25" fill="currentColor" strokeWidth="0.5" />
  </svg>
);
