import React from "react";

export type HtmlIconProps = {
  width?: number;
  height?: number;
};

export const HtmlIcon: React.FC<HtmlIconProps> = ({ width = 40, height = 40 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} fill="none">
    <path
      stroke="#D5D7DA"
      stroke-width="1.5"
      d="M7.75 4A3.25 3.25 0 0 1 11 .75h16c.121 0 .238.048.323.134l10.793 10.793a.46.46 0 0 1 .134.323v24A3.25 3.25 0 0 1 35 39.25H11A3.25 3.25 0 0 1 7.75 36z"
    />
    <path stroke="#D5D7DA" stroke-width="1.5" d="M27 .5V8a4 4 0 0 0 4 4h7.5" />
    <rect width="35" height="16" x="1" y="18" fill="#444CE7" rx="2" />
    <path
      fill="#fff"
      d="M4.65 30v-7.273h1.537v3.001H9.31v-3h1.534V30H9.309v-3.004H6.187V30zm7.184-6.005v-1.268h5.973v1.268H15.58V30h-1.52v-6.005zm6.956-1.268h1.897l2.002 4.887h.086l2.003-4.887h1.896V30h-1.492v-4.734h-.06l-1.882 4.699h-1.016l-1.882-4.716h-.06V30H18.79zM27.94 30v-7.273h1.538v6.005h3.118V30z"
    />
  </svg>
);
