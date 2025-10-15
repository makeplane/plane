import React from "react";

export type ZipIconProps = {
  width?: number;
  height?: number;
};

export const ZipIcon: React.FC<ZipIconProps> = ({ width = 40, height = 40 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} fill="none">
    <path
      stroke="#D5D7DA"
      stroke-width="1.5"
      d="M7.75 4A3.25 3.25 0 0 1 11 .75h16c.121 0 .238.048.323.134l10.793 10.793a.46.46 0 0 1 .134.323v24A3.25 3.25 0 0 1 35 39.25H11A3.25 3.25 0 0 1 7.75 36z"
    />
    <path stroke="#D5D7DA" stroke-width="1.5" d="M27 .5V8a4 4 0 0 0 4 4h7.5" />
    <rect width="22" height="16" x="1" y="18" fill="#344054" rx="2" />
    <path
      fill="#fff"
      d="M4.58 30v-.913l3.63-5.092H4.573v-1.268h5.568v.913L6.51 28.732h3.64V30zm8.286-7.273V30h-1.538v-7.273zM14.131 30v-7.273h2.87q.826 0 1.41.316.58.314.887.87.309.555.309 1.279t-.312 1.278-.906.863q-.59.309-1.428.309h-1.828V26.41h1.58q.444 0 .731-.153.292-.156.434-.43.145-.276.145-.635 0-.363-.145-.632a.97.97 0 0 0-.434-.423q-.291-.153-.738-.153h-1.037V30z"
    />
  </svg>
);
