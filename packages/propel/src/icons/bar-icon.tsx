import * as React from "react";

import type { ISvgIcons } from "./type";

export function BarIcon({ className = "", ...rest }: ISvgIcons) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...rest}>
      <path
        d="M0 12.5859C0 11.4814 0.89543 10.5859 2 10.5859H3.64706C4.75163 10.5859 5.64706 11.4814 5.64706 12.5859V23.9977H0V12.5859Z"
        fill="currentColor"
      />
      <path
        d="M9.17773 2C9.17773 0.89543 10.0732 0 11.1777 0H12.8248C13.9294 0 14.8248 0.895431 14.8248 2V24H9.17773V2Z"
        fill="currentColor"
      />
      <path
        d="M18.3535 8.35156C18.3535 7.247 19.2489 6.35156 20.3535 6.35156H22.0006C23.1051 6.35156 24.0006 7.24699 24.0006 8.35156V23.9986H18.3535V8.35156Z"
        fill="currentColor"
      />
    </svg>
  );
}
