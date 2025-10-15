import React from "react";

export type DefaultIconProps = {
  width?: number;
  height?: number;
};

export const DefaultIcon: React.FC<DefaultIconProps> = ({ width = 40, height = 40 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} fill="none">
    <path
      stroke="#D5D7DA"
      stroke-width="1.5"
      d="M4.75 4A3.25 3.25 0 0 1 8 .75h16c.121 0 .238.048.323.134l10.793 10.793a.46.46 0 0 1 .134.323v24A3.25 3.25 0 0 1 32 39.25H8A3.25 3.25 0 0 1 4.75 36z"
    />
    <path stroke="#D5D7DA" stroke-width="1.5" d="M24 .5V8a4 4 0 0 0 4 4h7.5" />
    <path
      stroke="#7F56D9"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="1.5"
      d="m20.75 20.25-.837-1.673c-.24-.482-.36-.723-.54-.899a1.5 1.5 0 0 0-.56-.346c-.239-.082-.508-.082-1.046-.082H14.9c-.84 0-1.26 0-1.581.163a1.5 1.5 0 0 0-.655.656c-.164.32-.164.74-.164 1.581v.6m0 0h11.4c1.26 0 1.89 0 2.372.245.423.216.767.56.983.983.245.482.245 1.112.245 2.372v3.3c0 1.26 0 1.89-.245 2.372-.216.423-.56.767-.983.983-.482.245-1.112.245-2.372.245h-7.8c-1.26 0-1.89 0-2.372-.245a2.25 2.25 0 0 1-.983-.983c-.245-.482-.245-1.112-.245-2.372z"
    />
  </svg>
);
