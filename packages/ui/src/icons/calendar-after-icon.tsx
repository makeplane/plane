import * as React from "react";

import { ISvgIcons } from "./type";

export const CalendarAfterIcon: React.FC<ISvgIcons> = ({ className = "fill-current", ...rest }) => (
  <svg viewBox="0 0 24 24" className={`${className} `} fill="none" xmlns="http://www.w3.org/2000/svg" {...rest}>
    <g clipPath="url(#clip0_3309_70901)">
      <path
        d="M10.6125 17V15.875H14.625V7.8125H3.375V11.9375H2.25V4.25C2.25 3.95 2.3625 3.6875 2.5875 3.4625C2.8125 3.2375 3.075 3.125 3.375 3.125H4.59375V2H5.8125V3.125H12.1875V2H13.4063V3.125H14.625C14.925 3.125 15.1875 3.2375 15.4125 3.4625C15.6375 3.6875 15.75 3.95 15.75 4.25V15.875C15.75 16.175 15.6375 16.4375 15.4125 16.6625C15.1875 16.8875 14.925 17 14.625 17H10.6125ZM6 18.2375L5.2125 17.45L7.33125 15.3125H0.9375V14.1875H7.33125L5.2125 12.05L6 11.2625L9.4875 14.75L6 18.2375ZM3.375 6.6875H14.625V4.25H3.375V6.6875Z"
        fill="rgb(var(--color-text-200))"
      />
    </g>
    <defs>
      <clipPath id="clip0_3309_70901">
        <rect width="18" height="18" fill="white" transform="translate(0 0.5)" />
      </clipPath>
    </defs>
  </svg>
);
