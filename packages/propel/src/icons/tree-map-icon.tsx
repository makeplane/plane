import * as React from "react";

import type { ISvgIcons } from "./type";

export function TreeMapIcon({ className = "", ...rest }: ISvgIcons) {
  return (
    <svg className={className} viewBox="0 0 27 22" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...rest}>
      <rect width="10" height="10" rx="1" fill="currentColor" />
      <rect x="11.5" width="10" height="6" rx="1" fill="currentColor" />
      <rect y="12" width="10" height="10" rx="1" fill="currentColor" />
      <rect x="11.5" y="16" width="10" height="6" rx="1" fill="currentColor" />
      <rect x="11.5" y="8" width="10" height="6" rx="1" fill="currentColor" />
      <rect x="23" width="4" height="11" rx="1" fill="currentColor" />
      <rect x="23" y="13" width="4" height="4" rx="1" fill="currentColor" />
      <rect x="23" y="19" width="4" height="3" rx="1" fill="currentColor" />
    </svg>
  );
}
