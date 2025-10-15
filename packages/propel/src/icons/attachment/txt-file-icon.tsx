import React from "react";

export type TxtIconProps = {
  width?: number;
  height?: number;
};

export const TxtIcon: React.FC<TxtIconProps> = ({ width = 40, height = 40 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} fill="none">
    <path
      stroke="#D5D7DA"
      stroke-width="1.5"
      d="M7.75 4A3.25 3.25 0 0 1 11 .75h16c.121 0 .238.048.323.134l10.793 10.793a.46.46 0 0 1 .134.323v24A3.25 3.25 0 0 1 35 39.25H11A3.25 3.25 0 0 1 7.75 36z"
    />
    <path stroke="#D5D7DA" stroke-width="1.5" d="M27 .5V8a4 4 0 0 0 4 4h7.5" />
    <rect width="27" height="16" x="1" y="18" fill="#475467" rx="2" />
    <path
      fill="#fff"
      d="M4.601 23.995v-1.268h5.973v1.268H8.348V30h-1.52v-6.005zM13 22.727l1.466 2.479h.057l1.474-2.479h1.736l-2.22 3.637L17.784 30h-1.768l-1.492-2.482h-.057L12.975 30h-1.762l2.277-3.636-2.234-3.637zm5.43 1.268v-1.268h5.972v1.268h-2.226V30h-1.52v-6.005z"
    />
  </svg>
);
