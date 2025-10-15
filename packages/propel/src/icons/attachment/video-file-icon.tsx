import React from "react";

export type VideoIconProps = {
  width?: number;
  height?: number;
};

export const VideoIcon: React.FC<VideoIconProps> = ({ width = 40, height = 40 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} fill="none">
    <path
      stroke="#D5D7DA"
      stroke-width="1.5"
      d="M4.75 4A3.25 3.25 0 0 1 8 .75h16c.121 0 .238.048.323.134l10.793 10.793a.46.46 0 0 1 .134.323v24A3.25 3.25 0 0 1 32 39.25H8A3.25 3.25 0 0 1 4.75 36z"
    />
    <path stroke="#D5D7DA" stroke-width="1.5" d="M24 .5V8a4 4 0 0 0 4 4h7.5" />
    <g clip-path="url(#video_svg__a)">
      <path
        stroke="#155EEF"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="1.5"
        d="M12.5 24h15m-15-3.75h3.75m7.5 0h3.75m-15 7.5h3.75m7.5 0h3.75M16.25 31.5v-15m7.5 15v-15m-7.65 15h7.8c1.26 0 1.89 0 2.372-.245.423-.216.767-.56.983-.983.245-.482.245-1.112.245-2.372v-7.8c0-1.26 0-1.89-.245-2.372a2.25 2.25 0 0 0-.983-.983C25.79 16.5 25.16 16.5 23.9 16.5h-7.8c-1.26 0-1.89 0-2.372.245-.423.216-.767.56-.983.983-.245.482-.245 1.112-.245 2.372v7.8c0 1.26 0 1.89.245 2.372.216.423.56.767.984.983.48.245 1.11.245 2.371.245"
      />
    </g>
    <defs>
      <clipPath id="video_svg__a">
        <path fill="#fff" d="M11 15h18v18H11z" />
      </clipPath>
    </defs>
  </svg>
);
