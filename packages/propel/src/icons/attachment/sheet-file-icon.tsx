import React from "react";

export type SheetIconProps = {
  width?: number;
  height?: number;
};

export const SheetIcon: React.FC<SheetIconProps> = ({ width = 40, height = 40 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} fill="none">
    <path
      stroke="#D5D7DA"
      stroke-width="1.5"
      d="M4.75 4A3.25 3.25 0 0 1 8 .75h16c.121 0 .238.048.323.134l10.793 10.793a.46.46 0 0 1 .134.323v24A3.25 3.25 0 0 1 32 39.25H8A3.25 3.25 0 0 1 4.75 36z"
    />
    <path stroke="#D5D7DA" stroke-width="1.5" d="M24 .5V8a4 4 0 0 0 4 4h7.5" />
    <path
      stroke="#079455"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="1.5"
      d="M11.9 24.9h16.2m-16.2 0v-3.6a1.8 1.8 0 0 1 1.8-1.8h3.6m-5.4 5.4v3.6a1.8 1.8 0 0 0 1.8 1.8h3.6m10.8-5.4v3.6a1.8 1.8 0 0 1-1.8 1.8h-9m10.8-5.4v-3.6a1.8 1.8 0 0 0-1.8-1.8h-9m0 0v10.8"
    />
  </svg>
);
