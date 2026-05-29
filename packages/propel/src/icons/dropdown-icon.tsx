import * as React from "react";

import type { ISvgIcons } from "./type";

export function DropdownIcon({ className = "text-current", ...rest }: ISvgIcons) {
  return (
    <svg
      viewBox="0 0 7 5"
      className={`${className} stroke-2`}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      {...rest}
    >
      <path d="M2.77267 4.0211L0.457719 1.78653C0.162864 1.50191 0.0961218 1.17467 0.257492 0.8048C0.418861 0.434934 0.70939 0.25 1.12908 0.25H5.72716C6.14685 0.25 6.43738 0.434934 6.59875 0.8048C6.76012 1.17467 6.69338 1.50191 6.39855 1.78653L4.08357 4.0211C3.98662 4.1147 3.88435 4.18329 3.77676 4.22687C3.66918 4.27046 3.55297 4.29225 3.42813 4.29225C3.30328 4.29225 3.18706 4.27046 3.07948 4.22687C2.97191 4.18329 2.86964 4.1147 2.77267 4.0211Z" />
    </svg>
  );
}
