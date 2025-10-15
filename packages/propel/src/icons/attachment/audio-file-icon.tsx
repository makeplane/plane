import React from "react";

export type AudioIconProps = {
  width?: number;
  height?: number;
};

export const AudioIcon: React.FC<AudioIconProps> = ({ width = 40, height = 40 }) => (
  <svg width={width} height={height} xmlns="http://www.w3.org/2000/svg" fill="none">
    <path
      stroke="#D5D7DA"
      strokeWidth="1.5"
      d="M4.75 4A3.25 3.25 0 0 1 8 .75h16c.121 0 .238.048.323.134l10.793 10.793a.46.46 0 0 1 .134.323v24A3.25 3.25 0 0 1 32 39.25H8A3.25 3.25 0 0 1 4.75 36z"
    />
    <path stroke="#D5D7DA" strokeWidth="1.5" d="M24 .5V8a4 4 0 0 0 4 4h7.5" />
    <path
      stroke="#DD2590"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M16.85 28.5v-8.733c0-.362 0-.542.066-.689a.75.75 0 0 1 .269-.317c.133-.089.312-.119.668-.178l6.6-1.1c.48-.08.72-.12.908-.05a.75.75 0 0 1 .39.33c.099.172.099.416.099.904V27m-9 1.5a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0m9-1.5a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0"
    />
  </svg>
);
