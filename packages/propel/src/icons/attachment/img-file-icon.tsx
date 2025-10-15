import React from "react";

export type ImgIconProps = {
  width?: number;
  height?: number;
};

export const ImgIcon: React.FC<ImgIconProps> = ({ width = 40, height = 40 }) => (
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
      d="M25.25 30.75h.758c.728 0 1.092 0 1.293-.152a.75.75 0 0 0 .296-.553c.015-.252-.187-.555-.59-1.16l-2.259-3.387c-.333-.501-.5-.751-.71-.839a.75.75 0 0 0-.575 0c-.21.088-.378.338-.712.839l-.558.837m3.057 4.415-5.763-8.325c-.332-.479-.498-.718-.705-.802a.75.75 0 0 0-.564 0c-.207.084-.373.323-.705.802l-4.46 6.442c-.422.61-.633.915-.62 1.168a.75.75 0 0 0 .293.56c.201.155.572.155 1.314.155zm1.5-11.25a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0"
    />
  </svg>
);
