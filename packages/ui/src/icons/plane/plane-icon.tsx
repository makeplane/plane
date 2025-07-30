import * as React from "react";

import { ISvgIcons } from "../type";

export const PlaneIcon: React.FC<ISvgIcons> = ({ className = "text-current", ...rest }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...rest}>
    <path d="M24 0H8V8.19512H16V16.0976H24V0Z" fill="currentColor" />
    <rect y="8.19507" width="8" height="7.90244" fill="currentColor" />
    <rect x="8" y="16.0974" width="8" height="7.90244" fill="currentColor" />
  </svg>
);
