import * as React from "react";

import { ISvgIcons } from "./type";

export const MovedIcon: React.FC<ISvgIcons> = ({ className = "text-current", ...rest }) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...rest}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M5.5931 2.74458C5.49469 2.69217 5.3847 2.66528 5.2732 2.66637L5.26667 2.66644L2.66667 2.66641C2.48985 2.66641 2.32028 2.73664 2.19526 2.86167C2.07024 2.98669 2 3.15626 2 3.33307V4.99974C2 5.36793 1.70152 5.66641 1.33333 5.66641C0.965142 5.66641 0.666665 5.36793 0.666665 4.99974V3.33307C0.666665 2.80264 0.877379 2.29393 1.25245 1.91886C1.62752 1.54379 2.13623 1.33307 2.66667 1.33307H5.26373C5.59698 1.3304 5.92564 1.41106 6.21983 1.56772C6.51384 1.7243 6.76407 1.95182 6.94782 2.22961L7.49014 3.03305C7.55085 3.12522 7.63345 3.20091 7.73061 3.25327C7.82774 3.30562 7.93633 3.33304 8.04667 3.33307C8.04663 3.33307 8.0467 3.33307 8.04667 3.33307H13.3333C13.8638 3.33307 14.3725 3.54379 14.7475 3.91886C15.1226 4.29393 15.3333 4.80264 15.3333 5.33307V11.9997C15.3333 12.5302 15.1226 13.0389 14.7475 13.414C14.3725 13.789 13.8638 13.9997 13.3333 13.9997H2.67616C2.22599 14.0114 1.78493 13.8707 1.4245 13.6004C1.06097 13.3278 0.801124 12.9394 0.687749 12.4994C0.595885 12.1429 0.810453 11.7794 1.167 11.6875C1.52354 11.5956 1.88705 11.8102 1.97891 12.1667C2.01671 12.3134 2.10332 12.4429 2.2245 12.5337C2.34567 12.6246 2.49419 12.6715 2.64558 12.6667C2.65261 12.6665 2.65964 12.6664 2.66667 12.6664H13.3333C13.5101 12.6664 13.6797 12.5962 13.8047 12.4711C13.9298 12.3461 14 12.1765 14 11.9997V5.33307C14 5.15626 13.9298 4.98669 13.8047 4.86167C13.6797 4.73664 13.5101 4.66641 13.3333 4.66641H8.04667C7.71556 4.66635 7.38953 4.58409 7.09806 4.42701C6.80781 4.27059 6.56076 4.04485 6.37887 3.76991L5.8365 2.9664C5.77518 2.87327 5.69152 2.79699 5.5931 2.74458Z"
      fill="currentColor"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M0.666748 8.66667C0.666748 8.29848 0.965225 8 1.33341 8H8.00008C8.36827 8 8.66675 8.29848 8.66675 8.66667C8.66675 9.03486 8.36827 9.33333 8.00008 9.33333H1.33341C0.965225 9.33333 0.666748 9.03486 0.666748 8.66667Z"
      fill="currentColor"
    />
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M3.80482 6.19526C4.06517 6.45561 4.06517 6.87772 3.80482 7.13807L2.27622 8.66667L3.80482 10.1953C4.06517 10.4556 4.06517 10.8777 3.80482 11.1381C3.54447 11.3984 3.12236 11.3984 2.86201 11.1381L0.86201 9.13807C0.601661 8.87772 0.601661 8.45561 0.86201 8.19526L2.86201 6.19526C3.12236 5.93491 3.54447 5.93491 3.80482 6.19526Z"
      fill="currentColor"
    />
  </svg>
);
